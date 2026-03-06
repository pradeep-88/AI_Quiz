export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    timeLimit: number;
    points: number;
}

export interface Quiz {
    id: string;
    title: string;
    topic: string;
    difficulty: string;
    hostId: string;
    questions: Question[];
    status: 'waiting' | 'active' | 'finished';
    currentQuestionIndex: number;
}

export interface Player {
    id: string;
    name: string;
    score: number;
    streak: number;
}
