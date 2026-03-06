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
exports.generateQuizQuestions = void 0;
const uuid_1 = require("uuid");
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Use a fast model; stays under free tier and works well for JSON.
const MODEL = "llama-3.1-8b-instant";
console.log("Groq API Key loaded:", GROQ_API_KEY ? GROQ_API_KEY.substring(0, 7) + "..." : "Not Found");
console.log("Groq model:", MODEL);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Rate limiter: max 30 requests per 60 seconds
const MAX_REQUESTS_PER_MINUTE = 30;
const WINDOW_MS = 60000;
const requestTimestamps = [];
function rateLimit() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = Date.now();
        const cutoff = now - WINDOW_MS;
        while (requestTimestamps.length > 0 && requestTimestamps[0] < cutoff) {
            requestTimestamps.shift();
        }
        if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
            const waitMs = requestTimestamps[0] + WINDOW_MS - now;
            if (waitMs > 0) {
                console.log(`Rate limit: waiting ${Math.ceil(waitMs / 1000)}s (${requestTimestamps.length} requests in last ${WINDOW_MS / 1000}s)`);
                yield delay(waitMs);
                return rateLimit();
            }
        }
        requestTimestamps.push(Date.now());
    });
}
function callGroq(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const res = yield fetch(GROQ_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.4,
                max_tokens: 4096,
            }),
        });
        if (!res.ok) {
            const errText = yield res.text();
            const err = new Error(`Groq API error: ${res.status} ${res.statusText}`);
            err.status = res.status;
            err.message = err.message + " " + errText;
            throw err;
        }
        const data = (yield res.json());
        const content = (_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        if (typeof content !== "string") {
            throw new Error("Groq API returned no content");
        }
        return content;
    });
}
const generateQuizQuestions = (topic_1, ...args_1) => __awaiter(void 0, [topic_1, ...args_1], void 0, function* (topic, count = 5, difficulty = "medium") {
    yield rateLimit();
    const prompt = `Generate ${count} multiple-choice questions about "${topic}" at ${difficulty} difficulty level.
Return the response ONLY as a valid JSON array of objects with this structure:
[
  {
    "text": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The correct option text exactly as it appears in options",
    "timeLimit": 20,
    "points": 100
  }
]
Do not include any markdown formatting or code blocks. Just the raw JSON array.`;
    let retries = 3;
    let waitTime = 2000;
    while (retries > 0) {
        try {
            const text = yield callGroq(prompt);
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const questions = JSON.parse(cleaned);
            if (!Array.isArray(questions)) {
                throw new Error("Response is not a JSON array");
            }
            return questions.map((q, index) => {
                var _a;
                // Normalize: some LLMs return "question" instead of "text", or "choices" instead of "options"
                const text = typeof q.text === "string"
                    ? q.text
                    : typeof q.question === "string"
                        ? q.question
                        : "";
                let options = Array.isArray(q.options)
                    ? q.options
                    : Array.isArray(q.choices)
                        ? q.choices
                        : [];
                options = options.map((o) => { var _a, _b; return (typeof o === "string" ? o : (_b = (_a = o === null || o === void 0 ? void 0 : o.text) !== null && _a !== void 0 ? _a : o === null || o === void 0 ? void 0 : o.label) !== null && _b !== void 0 ? _b : String(o)); });
                const opts = options.length >= 2 ? options : ["Option A", "Option B", "Option C", "Option D"];
                const rawCorrect = typeof q.correctAnswer === "string" ? q.correctAnswer : (_a = opts[0]) !== null && _a !== void 0 ? _a : "";
                const normalizedCorrect = (raw) => {
                    var _a;
                    const key = raw.trim().toLowerCase();
                    const found = opts.find((o) => o.trim().toLowerCase() === key);
                    return (_a = found !== null && found !== void 0 ? found : opts[0]) !== null && _a !== void 0 ? _a : "";
                };
                const normalized = {
                    id: (0, uuid_1.v4)(),
                    text: text || "No question text",
                    options: opts,
                    correctAnswer: normalizedCorrect(rawCorrect),
                    timeLimit: typeof q.timeLimit === "number" ? q.timeLimit : 20,
                    points: typeof q.points === "number" ? q.points : 100,
                };
                // #region agent log
                if (index === 0) {
                    fetch('http://127.0.0.1:7370/ingest/b4b8f19c-e376-4972-8090-aaf1c514cefd', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fb7605' }, body: JSON.stringify({ sessionId: 'fb7605', location: 'groq.service.ts:normalize', message: 'first question after normalize', data: { rawHasText: typeof q.text === 'string', rawHasQuestion: typeof q.question === 'string', normalizedTextPreview: normalized.text.slice(0, 100), normalizedOptionsCount: normalized.options.length }, hypothesisId: 'H1', timestamp: Date.now() }) }).catch(() => { });
                }
                // #endregion
                return normalized;
            });
        }
        catch (error) {
            console.error(`Error generating quiz (Attempt ${4 - retries}/3):`, error.message);
            if (error.status === 429 || (error.message && error.message.includes("429"))) {
                const match = (error.message || "").match(/[Rr]etry in (\d+(?:\.\d+)?)s/);
                const waitMs = match
                    ? Math.min(parseFloat(match[1]) * 1000, 60000)
                    : waitTime;
                console.log(`Rate limited. Waiting ${Math.round(waitMs / 1000)}s...`);
                yield delay(waitMs);
                waitTime *= 2;
                retries--;
            }
            else {
                throw error;
            }
        }
    }
    throw new Error("Failed to generate quiz questions after multiple attempts. Try again in a minute.");
});
exports.generateQuizQuestions = generateQuizQuestions;
