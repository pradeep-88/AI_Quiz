import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export const setGameState = async (roomId: string, state: any) => {
    await redisClient.set(`room:${roomId}`, JSON.stringify(state));
};

export const getGameState = async (roomId: string) => {
    const data = await redisClient.get(`room:${roomId}`);
    return data ? JSON.parse(data) : null;
};

export const addPlayerScore = async (roomId: string, playerId: string, score: number) => {
    await redisClient.zIncrBy(`leaderboard:${roomId}`, score, playerId);
};

export const getLeaderboard = async (roomId: string) => {
    // Get top 10 players with scores
    const result = await redisClient.zRangeWithScores(`leaderboard:${roomId}`, 0, 9, {
        REV: true
    });
    return result;
};

export const removeRoom = async (roomId: string) => {
    await redisClient.del(`room:${roomId}`);
    await redisClient.del(`leaderboard:${roomId}`);
}

export default redisClient;
