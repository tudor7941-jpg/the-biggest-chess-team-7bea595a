// Server-only quiz data (includes correct answer indices). Do not import from client code.
export type ServerQuizQuestion = {
  q: string;
  choices: string[];
  answer: number;
};

const QUIZZES: ServerQuizQuestion[][] = [
  // Sunday
  [
    {
      q: "How many squares are on a standard chess board?",
      choices: ["36", "49", "64", "81"],
      answer: 2,
    },
    {
      q: "Which piece can only move diagonally?",
      choices: ["Rook", "Bishop", "Knight", "Queen"],
      answer: 1,
    },
    {
      q: "What is a 'fork' in chess?",
      choices: ["A pawn move", "One piece attacking two", "A draw offer", "A castling type"],
      answer: 1,
    },
  ],
  // Monday
  [
    {
      q: "Which piece moves in an L-shape?",
      choices: ["Bishop", "Knight", "Rook", "King"],
      answer: 1,
    },
    {
      q: "What is castling?",
      choices: ["Moving 2 pawns", "King + rook special move", "Trading queens", "Promoting a pawn"],
      answer: 1,
    },
    {
      q: "The Sicilian Defense starts with?",
      choices: ["1.e4 e5", "1.e4 c5", "1.d4 d5", "1.c4 e5"],
      answer: 1,
    },
  ],
  // Tuesday
  [
    { q: "How many pawns does each side start with?", choices: ["6", "7", "8", "9"], answer: 2 },
    {
      q: "What does 'en passant' mean?",
      choices: ["In check", "In passing", "A promotion", "A stalemate"],
      answer: 1,
    },
    { q: "Value of a queen (traditional)?", choices: ["5", "7", "9", "10"], answer: 2 },
  ],
  // Wednesday
  [
    {
      q: "Which player moves first?",
      choices: ["Black", "White", "Random", "Whoever wants"],
      answer: 1,
    },
    {
      q: "A pawn reaching the last rank can become?",
      choices: ["A king", "Any piece except king", "Only a queen", "Only a knight"],
      answer: 1,
    },
    { q: "Stalemate results in?", choices: ["A win", "A loss", "A draw", "Replay"], answer: 2 },
  ],
  // Thursday
  [
    {
      q: "How many total pieces on the board at the start?",
      choices: ["24", "28", "32", "36"],
      answer: 2,
    },
    {
      q: "The Italian Game starts with?",
      choices: ["1.e4 e5 2.Nf3 Nc6 3.Bc4", "1.d4 Nf6", "1.c4 c5", "1.Nf3 d5"],
      answer: 0,
    },
    {
      q: "What is a 'pin'?",
      choices: ["A trapped king", "A piece stuck defending", "A promotion", "A castling right"],
      answer: 1,
    },
  ],
  // Friday
  [
    { q: "Bobby Fischer was from?", choices: ["Russia", "USA", "Norway", "India"], answer: 1 },
    { q: "How many bishops does each side start with?", choices: ["1", "2", "3", "4"], answer: 1 },
    {
      q: "What piece is often called the 'strongest'?",
      choices: ["Rook", "Knight", "Queen", "King"],
      answer: 2,
    },
  ],
  // Saturday
  [
    {
      q: "The King's Gambit begins?",
      choices: ["1.e4 e5 2.f4", "1.d4 d5 2.c4", "1.e4 c5", "1.Nf3 Nf6"],
      answer: 0,
    },
    {
      q: "What is 'zugzwang'?",
      choices: [
        "A winning attack",
        "Any move worsens position",
        "A pawn structure",
        "A castling variant",
      ],
      answer: 1,
    },
    {
      q: "The World Champion in 2024?",
      choices: ["Magnus Carlsen", "Ding Liren", "Gukesh D", "Ian Nepomniachtchi"],
      answer: 2,
    },
  ],
];

export function getServerTodayQuiz(): ServerQuizQuestion[] {
  const day = new Date().getUTCDay();
  return QUIZZES[day];
}
