import { Server, Socket } from 'socket.io';
import { generateQuizQuestions } from './groq.service';
import { setGameState, getGameState, addPlayerScore, getLeaderboard, connectRedis } from './redis.service';
import { generateRoomCode } from '../utils';
import { Quiz, Player, Question } from '../types';
import { v4 as uuidv4 } from 'uuid';

function normalizeRoomCode(roomCode: unknown): string {
    const s = typeof roomCode === 'string' ? roomCode.trim().toUpperCase() : '';
    return s;
}

function normalizeAnswerForComparison(value: string): string {
    return (value ?? '').trim().toLowerCase();
}

export const initializeSocket = (io: Server) => {
    connectRedis();

    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        // Host creates a room
        socket.on('create_room', async ({ topic, difficulty, count }: { topic: string, difficulty: string, count: number }, callback) => {
            try {
                const roomCode = generateRoomCode();
                const questions = await generateQuizQuestions(topic, count, difficulty);

                const newQuiz: Quiz = {
                    id: uuidv4(),
                    title: `Quiz on ${topic}`,
                    topic,
                    difficulty,
                    hostId: socket.id,
                    questions,
                    status: 'waiting',
                    currentQuestionIndex: -1
                };

                await setGameState(roomCode, { quiz: newQuiz, players: [] });
                socket.join(roomCode);

                callback({ success: true, roomCode, quiz: newQuiz });
                console.log(`Room ${roomCode} created by ${socket.id}`);
            } catch (error: any) {
                console.error('Create room error:', error);
                callback({ success: false, error: error?.message || 'Failed to create room' });
            }
        });

        // Player joins a room (normalize room code so Socket.IO room name matches Redis key)
        socket.on('join_room', async ({ roomCode, playerName }: { roomCode: string, playerName: string }, callback) => {
            const code = normalizeRoomCode(roomCode);
            if (!code) {
                callback({ success: false, error: 'Room code required' });
                return;
            }
            const roomState = await getGameState(code);
            if (!roomState) {
                callback({ success: false, error: 'Room not found' });
                return;
            }

            if (roomState.quiz.status !== 'waiting') {
                callback({ success: false, error: 'Quiz already started' });
                return;
            }

            const player: Player = {
                id: socket.id,
                name: playerName,
                score: 0,
                streak: 0
            };

            roomState.players.push(player);
            await setGameState(code, roomState);

            socket.join(code);
            io.to(code).emit('player_joined', player);

            // Send current players list to the new joiner
            callback({ success: true, quiz: roomState.quiz, players: roomState.players });
            console.log(`Player ${playerName} joined room ${code}`);
        });

        // Host starts the quiz (use normalized room code)
        socket.on('start_quiz', async ({ roomCode }) => {
            const code = normalizeRoomCode(roomCode);
            if (!code) return;
            const roomState = await getGameState(code);
            if (roomState && roomState.quiz.hostId === socket.id) {
                roomState.quiz.status = 'active';
                roomState.quiz.currentQuestionIndex = 0;
                await setGameState(code, roomState);

                io.to(code).emit('quiz_started');
                sendQuestion(io, code, roomState.quiz.questions[0]);
            }
        });

        // Player submits answer (questionId ensures we score against the question they answered, not current index)
        // Scoring: 1 point per correct answer only; no time-based bonus.
        // Also stores player answers and question stats for review and analytics.
        socket.on('submit_answer', async (payload: { roomCode: string; answer: string; timeLeft?: number; questionId?: string; questionIndex?: number }) => {
            const code = normalizeRoomCode(payload?.roomCode);
            if (!code) return;
            const roomState = await getGameState(code);
            if (!roomState) return;

            const { answer, questionId, questionIndex } = payload;
            let questionForScoring: Question | undefined;
            if (questionId) {
                questionForScoring = roomState.quiz.questions.find((q: Question) => q.id === questionId);
            }
            if (!questionForScoring && typeof questionIndex === 'number' && questionIndex >= 0 && questionIndex < roomState.quiz.questions.length) {
                questionForScoring = roomState.quiz.questions[questionIndex];
            }
            if (!questionForScoring) {
                questionForScoring = roomState.quiz.questions[roomState.quiz.currentQuestionIndex];
            }
            if (!questionForScoring) return;

            const isCorrect =
                normalizeAnswerForComparison(answer ?? '') ===
                normalizeAnswerForComparison(questionForScoring.correctAnswer ?? '');

            // Exactly 1 mark per correct answer; no additional points for time.
            const points = isCorrect ? 1 : 0;
            if (points > 0) {
                await addPlayerScore(code, socket.id, points);
            }

            // Store player answer for review
            if (!roomState.playerAnswers) roomState.playerAnswers = {};
            if (!roomState.playerAnswers[socket.id]) roomState.playerAnswers[socket.id] = [];
            const timeTaken = typeof payload.timeLeft === 'number' ? (questionForScoring.timeLimit - payload.timeLeft) : 0;
            roomState.playerAnswers[socket.id].push({
                questionId: questionForScoring.id,
                question: questionForScoring.text,
                options: questionForScoring.options ?? [],
                selectedAnswer: answer ?? '',
                correctAnswer: questionForScoring.correctAnswer ?? '',
                isCorrect,
                timeTaken
            });

            // Increment question stats for analytics
            if (!roomState.questionStats) roomState.questionStats = {};
            const qid = questionForScoring.id;
            if (!roomState.questionStats[qid]) roomState.questionStats[qid] = { correct: 0, incorrect: 0 };
            if (isCorrect) roomState.questionStats[qid].correct++;
            else roomState.questionStats[qid].incorrect++;

            await setGameState(code, roomState);
        });

        // Any participant (host or player) can move to next question — control is with joiners
        socket.on('next_question', async (payload) => {
            const roomCode = normalizeRoomCode(payload?.roomCode);
            console.log('[Quiz] next_question received', { payload, roomCode, socketId: socket.id });
            if (!roomCode) {
                console.warn('[Quiz] next_question ignored: empty roomCode');
                return;
            }
            try {
                const roomState = await getGameState(roomCode);
                const isHost = roomState?.quiz.hostId === socket.id;
                const isPlayer = roomState?.players?.some((p: Player) => p.id === socket.id);
                const isInRoomByAdapter = socket.rooms.has(roomCode);
                const isInRoom = roomState && (isHost || isPlayer || isInRoomByAdapter);
                console.log('[Quiz] next_question check', { hasRoomState: !!roomState, isHost, isPlayer, isInRoomByAdapter, isInRoom, currentIndex: roomState?.quiz?.currentQuestionIndex, playersCount: roomState?.players?.length });
                if (roomState && isInRoom) {
                    roomState.quiz.currentQuestionIndex++;

                    if (roomState.quiz.currentQuestionIndex < roomState.quiz.questions.length) {
                        const nextQuestion = roomState.quiz.questions[roomState.quiz.currentQuestionIndex];
                        await setGameState(roomCode, roomState);
                        console.log('[Quiz] sending next question', { index: roomState.quiz.currentQuestionIndex, total: roomState.quiz.questions.length });
                        sendQuestion(io, roomCode, nextQuestion);
                    } else {
                        roomState.quiz.status = 'finished';
                        await setGameState(roomCode, roomState);
                        console.log('[Quiz] quiz finished, emitting final_leaderboard then quiz_ended');
                        const leaderboard = await getLeaderboard(roomCode);
                        const populatedLeaderboard = mapLeaderboard(leaderboard, roomState.players);
                        io.to(roomCode).emit('final_leaderboard', populatedLeaderboard);
                        io.to(roomCode).emit('quiz_ended');
                    }
                } else {
                    console.warn('[Quiz] next_question ignored: not in room or no room state', { hasRoomState: !!roomState, isInRoom });
                }
            } catch (err) {
                console.error('[Quiz] next_question error', err);
            }
        });

        // Live leaderboard request (or pushed periodically)
        socket.on('get_leaderboard', async ({ roomCode }) => {
            const code = normalizeRoomCode(roomCode);
            if (!code) return;
            const roomState = await getGameState(code);
            if (roomState) {
                const leaderboard = await getLeaderboard(code);
                const populatedLeaderboard = mapLeaderboard(leaderboard, roomState.players);
                socket.emit('leaderboard_update', populatedLeaderboard);
            }
        });

        // Player review: returns attempted questions with selected/correct answers
        socket.on('get_player_review', async (payload: { roomCode: string; playerId: string }) => {
            const code = normalizeRoomCode(payload?.roomCode);
            const playerId = payload?.playerId;
            if (!code || !playerId) return;
            const roomState = await getGameState(code);
            if (!roomState?.playerAnswers?.[playerId]) {
                socket.emit('player_review_data', { questions: [] });
                return;
            }
            const questions = roomState.playerAnswers[playerId].map(
                (entry: { question: string; options: string[]; selectedAnswer: string; correctAnswer: string; isCorrect: boolean }) => ({
                    question: entry.question,
                    options: entry.options,
                    selectedAnswer: entry.selectedAnswer,
                    correctAnswer: entry.correctAnswer,
                    isCorrect: entry.isCorrect
                })
            );
            socket.emit('player_review_data', { questions });
        });

        // Host analytics: leaderboard + question stats
        socket.on('get_quiz_analytics', async (payload: { roomCode: string }) => {
            const code = normalizeRoomCode(payload?.roomCode);
            if (!code) return;
            const roomState = await getGameState(code);
            if (!roomState) {
                socket.emit('quiz_analytics', { leaderboard: [], questionStats: [] });
                return;
            }
            const leaderboard = await getLeaderboard(code);
            const populatedLeaderboard = mapLeaderboard(leaderboard, roomState.players);
            const questionStats: Array<{ questionId: string; question: string; correctCount: number; incorrectCount: number; totalAttempts: number }> = [];
            const stats = roomState.questionStats ?? {};
            for (const q of roomState.quiz.questions ?? []) {
                const s = stats[q.id] ?? { correct: 0, incorrect: 0 };
                const correctCount = s.correct ?? 0;
                const incorrectCount = s.incorrect ?? 0;
                questionStats.push({
                    questionId: q.id,
                    question: q.text,
                    correctCount,
                    incorrectCount,
                    totalAttempts: correctCount + incorrectCount
                });
            }
            socket.emit('quiz_analytics', { leaderboard: populatedLeaderboard, questionStats });
        });

        socket.on('disconnect', () => {
            // Handle cleanup if needed
        });
    });
};

const sendQuestion = (io: Server, roomCode: string, question: Question) => {
    io.to(roomCode).emit('new_question', {
        question: {
            ...question,
            correctAnswer: undefined // Hide answer from client
        }
    });
};

const mapLeaderboard = (redisData: Array<{ value: string; score: number }> | string[], players: Player[]) => {
    // node-redis v5 returns [{ value, score }, ...]; legacy flat array [id, score, id, score, ...]
    const entries: { socketId: string; score: number }[] = []
    if (redisData.length > 0 && typeof redisData[0] === 'object' && redisData[0] !== null && 'value' in redisData[0]) {
        for (const item of redisData as Array<{ value: string; score: number }>) {
            entries.push({ socketId: item.value, score: Number(item.score) })
        }
    } else {
        const flat = redisData as string[]
        for (let i = 0; i < flat.length; i += 2) {
            entries.push({ socketId: flat[i], score: parseInt(flat[i + 1], 10) })
        }
    }
    return entries
        .map(({ socketId, score }) => {
            const player = players.find(p => p.id === socketId)
            if (!player) return null
            return { name: player.name, score, id: socketId }
        })
        .filter(Boolean) as { name: string; score: number; id: string }[]
}
