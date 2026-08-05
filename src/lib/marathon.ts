// Client-safe marathon (long chess minigame) types. Answers live on the server.
export type MarathonQuestion = {
  q: string;
  choices: string[];
};

export function getTodayMarathonKey(): string {
  return new Date().toISOString().slice(0, 10);
}
