"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoomCode = void 0;
const generateRoomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};
exports.generateRoomCode = generateRoomCode;
