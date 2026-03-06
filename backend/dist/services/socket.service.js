"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const groq_service_1 = require("./groq.service");
const redis_service_1 = require("./redis.service");
const utils_1 = require("../utils");
const uuid_1 = require("uuid");
function normalizeRoomCode(roomCode) {
    const s = typeof roomCode === 'string' ? roomCode.trim().toUpperCase() : '';
    return s;
}
function normalizeAnswerForComparison(value) {
    return (value !== null && value !== void 0 ? value : '').trim().toLowerCase();
}
const initializeSocket = (io) => {
    (0, redis_service_1.connectRedis)();
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        // Host creates a room
        socket.on('create_room', (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ topic, difficulty, count }, callback) {
            try {
                const roomCode = (0, utils_1.generateRoomCode)();
                const questions = yield (0, groq_service_1.generateQuizQuestions)(topic, count, difficulty);
                const newQuiz = {
                    id: (0, uuid_1.v4)(),
                    title: `Quiz on ${topic}`,
                    topic,
                    difficulty,
                    hostId: socket.id,
                    questions,
                    status: 'waiting',
                    currentQuestionIndex: -1
                };
                yield (0, redis_service_1.setGameState)(roomCode, { quiz: newQuiz, players: [] });
                socket.join(roomCode);
                callback({ success: true, roomCode, quiz: newQuiz });
                console.log(`Room ${roomCode} created by ${socket.id}`);
            }
            catch (error) {
                console.error('Create room error:', error);
                callback({ success: false, error: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to create room' });
            }
        }));
        // Player joins a room (normalize room code so Socket.IO room name matches Redis key)
        socket.on('join_room', (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomCode, playerName }, callback) {
            const code = normalizeRoomCode(roomCode);
            if (!code) {
                callback({ success: false, error: 'Room code required' });
                return;
            }
            const roomState = yield (0, redis_service_1.getGameState)(code);
            if (!roomState) {
                callback({ success: false, error: 'Room not found' });
                return;
            }
            if (roomState.quiz.status !== 'waiting') {
                callback({ success: false, error: 'Quiz already started' });
                return;
            }
            const player = {
                id: socket.id,
                name: playerName,
                score: 0,
                streak: 0
            };
            roomState.players.push(player);
            yield (0, redis_service_1.setGameState)(code, roomState);
            socket.join(code);
            io.to(code).emit('player_joined', player);
            // Send current players list to the new joiner
            callback({ success: true, quiz: roomState.quiz, players: roomState.players });
            console.log(`Player ${playerName} joined room ${code}`);
        }));
        // Host starts the quiz (use normalized room code)
        socket.on('start_quiz', (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomCode }) {
            const code = normalizeRoomCode(roomCode);
            if (!code)
                return;
            const roomState = yield (0, redis_service_1.getGameState)(code);
            if (roomState && roomState.quiz.hostId === socket.id) {
                roomState.quiz.status = 'active';
                roomState.quiz.currentQuestionIndex = 0;
                yield (0, redis_service_1.setGameState)(code, roomState);
                io.to(code).emit('quiz_started');
                sendQuestion(io, code, roomState.quiz.questions[0]);
            }
        }));
        // Player submits answer (questionId ensures we score against the question they answered, not current index)
        // Scoring: 1 point per correct answer only; no time-based bonus.
        // Also stores player answers and question stats for review and analytics.
        socket.on('submit_answer', (payload) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const code = normalizeRoomCode(payload === null || payload === void 0 ? void 0 : payload.roomCode);
            if (!code)
                return;
            const roomState = yield (0, redis_service_1.getGameState)(code);
            if (!roomState)
                return;
            const { answer, questionId, questionIndex } = payload;
            let questionForScoring;
            if (questionId) {
                questionForScoring = roomState.quiz.questions.find((q) => q.id === questionId);
            }
            if (!questionForScoring && typeof questionIndex === 'number' && questionIndex >= 0 && questionIndex < roomState.quiz.questions.length) {
                questionForScoring = roomState.quiz.questions[questionIndex];
            }
            if (!questionForScoring) {
                questionForScoring = roomState.quiz.questions[roomState.quiz.currentQuestionIndex];
            }
            if (!questionForScoring)
                return;
            const isCorrect = normalizeAnswerForComparison(answer !== null && answer !== void 0 ? answer : '') ===
                normalizeAnswerForComparison((_a = questionForScoring.correctAnswer) !== null && _a !== void 0 ? _a : '');
            // Exactly 1 mark per correct answer; no additional points for time.
            const points = isCorrect ? 1 : 0;
            if (points > 0) {
                yield (0, redis_service_1.addPlayerScore)(code, socket.id, points);
            }
            // Store player answer for review
            if (!roomState.playerAnswers)
                roomState.playerAnswers = {};
            if (!roomState.playerAnswers[socket.id])
                roomState.playerAnswers[socket.id] = [];
            const timeTaken = typeof payload.timeLeft === 'number' ? (questionForScoring.timeLimit - payload.timeLeft) : 0;
            roomState.playerAnswers[socket.id].push({
                questionId: questionForScoring.id,
                question: questionForScoring.text,
                options: (_b = questionForScoring.options) !== null && _b !== void 0 ? _b : [],
                selectedAnswer: answer !== null && answer !== void 0 ? answer : '',
                correctAnswer: (_c = questionForScoring.correctAnswer) !== null && _c !== void 0 ? _c : '',
                isCorrect,
                timeTaken
            });
            // Increment question stats for analytics
            if (!roomState.questionStats)
                roomState.questionStats = {};
            const qid = questionForScoring.id;
            if (!roomState.questionStats[qid])
                roomState.questionStats[qid] = { correct: 0, incorrect: 0 };
            if (isCorrect)
                roomState.questionStats[qid].correct++;
            else
                roomState.questionStats[qid].incorrect++;
            yield (0, redis_service_1.setGameState)(code, roomState);
        }));
        // Any participant (host or player) can move to next question — control is with joiners
        socket.on('next_question', (payload) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const roomCode = normalizeRoomCode(payload === null || payload === void 0 ? void 0 : payload.roomCode);
            console.log('[Quiz] next_question received', { payload, roomCode, socketId: socket.id });
            if (!roomCode) {
                console.warn('[Quiz] next_question ignored: empty roomCode');
                return;
            }
            try {
                const roomState = yield (0, redis_service_1.getGameState)(roomCode);
                const isHost = (roomState === null || roomState === void 0 ? void 0 : roomState.quiz.hostId) === socket.id;
                const isPlayer = (_a = roomState === null || roomState === void 0 ? void 0 : roomState.players) === null || _a === void 0 ? void 0 : _a.some((p) => p.id === socket.id);
                const isInRoomByAdapter = socket.rooms.has(roomCode);
                const isInRoom = roomState && (isHost || isPlayer || isInRoomByAdapter);
                console.log('[Quiz] next_question check', { hasRoomState: !!roomState, isHost, isPlayer, isInRoomByAdapter, isInRoom, currentIndex: (_b = roomState === null || roomState === void 0 ? void 0 : roomState.quiz) === null || _b === void 0 ? void 0 : _b.currentQuestionIndex, playersCount: (_c = roomState === null || roomState === void 0 ? void 0 : roomState.players) === null || _c === void 0 ? void 0 : _c.length });
                if (roomState && isInRoom) {
                    roomState.quiz.currentQuestionIndex++;
                    if (roomState.quiz.currentQuestionIndex < roomState.quiz.questions.length) {
                        const nextQuestion = roomState.quiz.questions[roomState.quiz.currentQuestionIndex];
                        yield (0, redis_service_1.setGameState)(roomCode, roomState);
                        console.log('[Quiz] sending next question', { index: roomState.quiz.currentQuestionIndex, total: roomState.quiz.questions.length });
                        sendQuestion(io, roomCode, nextQuestion);
                    }
                    else {
                        roomState.quiz.status = 'finished';
                        yield (0, redis_service_1.setGameState)(roomCode, roomState);
                        console.log('[Quiz] quiz finished, emitting final_leaderboard then quiz_ended');
                        const leaderboard = yield (0, redis_service_1.getLeaderboard)(roomCode);
                        const populatedLeaderboard = mapLeaderboard(leaderboard, roomState.players);
                        io.to(roomCode).emit('final_leaderboard', populatedLeaderboard);
                        io.to(roomCode).emit('quiz_ended');
                    }
                }
                else {
                    console.warn('[Quiz] next_question ignored: not in room or no room state', { hasRoomState: !!roomState, isInRoom });
                }
            }
            catch (err) {
                console.error('[Quiz] next_question error', err);
            }
        }));
        // Live leaderboard request (or pushed periodically)
        socket.on('get_leaderboard', (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomCode }) {
            const code = normalizeRoomCode(roomCode);
            if (!code)
                return;
            const roomState = yield (0, redis_service_1.getGameState)(code);
            if (roomState) {
                const leaderboard = yield (0, redis_service_1.getLeaderboard)(code);
                const populatedLeaderboard = mapLeaderboard(leaderboard, roomState.players);
                socket.emit('leaderboard_update', populatedLeaderboard);
            }
        }));
        // Player review: returns attempted questions with selected/correct answers
        socket.on('get_player_review', (payload) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const code = normalizeRoomCode(payload === null || payload === void 0 ? void 0 : payload.roomCode);
            const playerId = payload === null || payload === void 0 ? void 0 : payload.playerId;
            if (!code || !playerId)
                return;
            const roomState = yield (0, redis_service_1.getGameState)(code);
            if (!((_a = roomState === null || roomState === void 0 ? void 0 : roomState.playerAnswers) === null || _a === void 0 ? void 0 : _a[playerId])) {
                socket.emit('player_review_data', { questions: [] });
                return;
            }
            const questions = roomState.playerAnswers[playerId].map((entry) => ({
                question: entry.question,
                options: entry.options,
                selectedAnswer: entry.selectedAnswer,
                correctAnswer: entry.correctAnswer,
                isCorrect: entry.isCorrect
            }));
            socket.emit('player_review_data', { questions });
        }));
        // Host analytics: leaderboard + question stats
        socket.on('get_quiz_analytics', (payload) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const code = normalizeRoomCode(payload === null || payload === void 0 ? void 0 : payload.roomCode);
            if (!code)
                return;
            const roomState = yield (0, redis_service_1.getGameState)(code);
            if (!roomState) {
                socket.emit('quiz_analytics', { leaderboard: [], questionStats: [] });
                return;
            }
            const leaderboard = yield (0, redis_service_1.getLeaderboard)(code);
            const populatedLeaderboard = mapLeaderboard(leaderboard, roomState.players);
            const questionStats = [];
            const stats = (_a = roomState.questionStats) !== null && _a !== void 0 ? _a : {};
            for (const q of (_b = roomState.quiz.questions) !== null && _b !== void 0 ? _b : []) {
                const s = (_c = stats[q.id]) !== null && _c !== void 0 ? _c : { correct: 0, incorrect: 0 };
                const correctCount = (_d = s.correct) !== null && _d !== void 0 ? _d : 0;
                const incorrectCount = (_e = s.incorrect) !== null && _e !== void 0 ? _e : 0;
                questionStats.push({
                    questionId: q.id,
                    question: q.text,
                    correctCount,
                    incorrectCount,
                    totalAttempts: correctCount + incorrectCount
                });
            }
            socket.emit('quiz_analytics', { leaderboard: populatedLeaderboard, questionStats });
        }));
        socket.on('disconnect', () => {
            // Handle cleanup if needed
        });
    });
};
exports.initializeSocket = initializeSocket;
const sendQuestion = (io, roomCode, question) => {
    io.to(roomCode).emit('new_question', {
        question: Object.assign(Object.assign({}, question), { correctAnswer: undefined // Hide answer from client
         })
    });
};
const mapLeaderboard = (redisData, players) => {
    // node-redis v5 returns [{ value, score }, ...]; legacy flat array [id, score, id, score, ...]
    const entries = [];
    if (redisData.length > 0 && typeof redisData[0] === 'object' && redisData[0] !== null && 'value' in redisData[0]) {
        for (const item of redisData) {
            entries.push({ socketId: item.value, score: Number(item.score) });
        }
    }
    else {
        const flat = redisData;
        for (let i = 0; i < flat.length; i += 2) {
            entries.push({ socketId: flat[i], score: parseInt(flat[i + 1], 10) });
        }
    }
    return entries
        .map(({ socketId, score }) => {
        const player = players.find(p => p.id === socketId);
        if (!player)
            return null;
        return { name: player.name, score, id: socketId };
    })
        .filter(Boolean);
};
