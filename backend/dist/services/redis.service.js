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
exports.removeRoom = exports.getLeaderboard = exports.addPlayerScore = exports.getGameState = exports.setGameState = exports.connectRedis = void 0;
const redis_1 = require("redis");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!redisClient.isOpen) {
        yield redisClient.connect();
    }
});
exports.connectRedis = connectRedis;
const setGameState = (roomId, state) => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.set(`room:${roomId}`, JSON.stringify(state));
});
exports.setGameState = setGameState;
const getGameState = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield redisClient.get(`room:${roomId}`);
    return data ? JSON.parse(data) : null;
});
exports.getGameState = getGameState;
const addPlayerScore = (roomId, playerId, score) => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.zIncrBy(`leaderboard:${roomId}`, score, playerId);
});
exports.addPlayerScore = addPlayerScore;
const getLeaderboard = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get top 10 players with scores
    const result = yield redisClient.zRangeWithScores(`leaderboard:${roomId}`, 0, 9, {
        REV: true
    });
    return result;
});
exports.getLeaderboard = getLeaderboard;
const removeRoom = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.del(`room:${roomId}`);
    yield redisClient.del(`leaderboard:${roomId}`);
});
exports.removeRoom = removeRoom;
exports.default = redisClient;
