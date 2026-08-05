// Client-safe quiz types + helpers. Correct answers live only on the server (quiz.server.ts).
export type QuizQuestion = {
  q: string;
  choices: string[];
};

export function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}
