import { Question } from "../types";
import { v4 as uuidv4 } from "uuid";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Use a fast model; stays under free tier and works well for JSON.
const MODEL = "llama-3.1-8b-instant";

console.log(
  "Groq API Key loaded:",
  GROQ_API_KEY ? GROQ_API_KEY.substring(0, 7) + "..." : "Not Found"
);
console.log("Groq model:", MODEL);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Rate limiter: max 30 requests per 60 seconds
const MAX_REQUESTS_PER_MINUTE = 30;
const WINDOW_MS = 60_000;
const requestTimestamps: number[] = [];

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < cutoff) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const waitMs = requestTimestamps[0] + WINDOW_MS - now;
    if (waitMs > 0) {
      console.log(
        `Rate limit: waiting ${Math.ceil(waitMs / 1000)}s (${requestTimestamps.length} requests in last ${WINDOW_MS / 1000}s)`
      );
      await delay(waitMs);
      return rateLimit();
    }
  }
  requestTimestamps.push(Date.now());
}

async function callGroq(prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
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
    const errText = await res.text();
    const err: any = new Error(`Groq API error: ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.message = err.message + " " + errText;
    throw err;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Groq API returned no content");
  }
  return content;
}

export const generateQuizQuestions = async (
  topic: string,
  count: number = 5,
  difficulty: string = "medium"
): Promise<Question[]> => {
  await rateLimit();

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
      const text = await callGroq(prompt);
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const questions = JSON.parse(cleaned);

      if (!Array.isArray(questions)) {
        throw new Error("Response is not a JSON array");
      }

      return questions.map((q: any, index: number) => {
        // Normalize: some LLMs return "question" instead of "text", or "choices" instead of "options"
        const text =
          typeof q.text === "string"
            ? q.text
            : typeof q.question === "string"
              ? q.question
              : "";
        let options: string[] = Array.isArray(q.options)
          ? q.options
          : Array.isArray(q.choices)
            ? q.choices
            : [];
        options = options.map((o: any) => (typeof o === "string" ? o : o?.text ?? o?.label ?? String(o)));
        const opts = options.length >= 2 ? options : ["Option A", "Option B", "Option C", "Option D"];
        const rawCorrect = typeof q.correctAnswer === "string" ? q.correctAnswer : opts[0] ?? "";
        const normalizedCorrect = (raw: string) => {
          const key = raw.trim().toLowerCase();
          const found = opts.find((o) => o.trim().toLowerCase() === key);
          return found ?? opts[0] ?? "";
        };
        const normalized = {
          id: uuidv4(),
          text: text || "No question text",
          options: opts,
          correctAnswer: normalizedCorrect(rawCorrect),
          timeLimit: typeof q.timeLimit === "number" ? q.timeLimit : 20,
          points: typeof q.points === "number" ? q.points : 100,
        };
        // #region agent log
        if (index === 0) {
          fetch('http://127.0.0.1:7370/ingest/b4b8f19c-e376-4972-8090-aaf1c514cefd', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fb7605' }, body: JSON.stringify({ sessionId: 'fb7605', location: 'groq.service.ts:normalize', message: 'first question after normalize', data: { rawHasText: typeof q.text === 'string', rawHasQuestion: typeof q.question === 'string', normalizedTextPreview: normalized.text.slice(0, 100), normalizedOptionsCount: normalized.options.length }, hypothesisId: 'H1', timestamp: Date.now() }) }).catch(() => {});
        }
        // #endregion
        return normalized;
      });
    } catch (error: any) {
      console.error(
        `Error generating quiz (Attempt ${4 - retries}/3):`,
        error.message
      );

      if (error.status === 429 || (error.message && error.message.includes("429"))) {
        const match = (error.message || "").match(
          /[Rr]etry in (\d+(?:\.\d+)?)s/
        );
        const waitMs = match
          ? Math.min(parseFloat(match[1]) * 1000, 60000)
          : waitTime;
        console.log(`Rate limited. Waiting ${Math.round(waitMs / 1000)}s...`);
        await delay(waitMs);
        waitTime *= 2;
        retries--;
      } else {
        throw error;
      }
    }
  }

  throw new Error(
    "Failed to generate quiz questions after multiple attempts. Try again in a minute."
  );
};
