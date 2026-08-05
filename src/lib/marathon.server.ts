// Server-only marathon data (includes correct answer indices). Do not import from client code.
export type ServerMarathonQuestion = {
  q: string;
  choices: string[];
  answer: number;
};

// Rotating pool — one 10-question set per day of week.
const MARATHONS: ServerMarathonQuestion[][] = [
  // Sunday — Tactics
  [
    {
      q: "A knight fork simultaneously attacks the king and…?",
      choices: ["A pawn only", "Any other piece", "Just the queen", "Only the rook"],
      answer: 1,
    },
    {
      q: "A 'skewer' attacks a valuable piece so that when it moves…",
      choices: [
        "It disappears",
        "A less valuable piece is exposed",
        "It promotes",
        "The king castles",
      ],
      answer: 1,
    },
    {
      q: "'Zwischenzug' means?",
      choices: ["A pawn break", "In-between move", "Castling queenside", "A blunder"],
      answer: 1,
    },
    {
      q: "A discovered check is delivered by?",
      choices: [
        "The piece that moves",
        "The piece uncovered behind it",
        "The king",
        "The queen only",
      ],
      answer: 1,
    },
    {
      q: "Two rooks on the 7th rank are called?",
      choices: ["Blind swine", "Piggybacks", "Cannons", "Twin towers"],
      answer: 0,
    },
    {
      q: "What is a 'battery'?",
      choices: [
        "A weak pawn",
        "Two pieces on the same line targeting a square",
        "A trapped king",
        "A stalemate trap",
      ],
      answer: 1,
    },
    { q: "The value of a bishop is usually?", choices: ["1", "3", "5", "9"], answer: 1 },
    {
      q: "A passed pawn is one that…",
      choices: [
        "Has been captured",
        "Has no enemy pawns blocking or on adjacent files ahead",
        "Reached rank 5",
        "Is defended by a rook",
      ],
      answer: 1,
    },
    {
      q: "'Prophylaxis' in chess means?",
      choices: [
        "Attacking first",
        "Preventing opponent's plan",
        "Trading pieces",
        "Castling early",
      ],
      answer: 1,
    },
    {
      q: "A 'windmill' combination usually involves?",
      choices: ["Two knights", "Repeated discovered checks", "Pawn storm", "Bishop pair"],
      answer: 1,
    },
  ],
  // Monday — Openings
  [
    {
      q: "The Ruy Lopez begins with?",
      choices: ["1.e4 e5 2.Nf3 Nc6 3.Bb5", "1.d4 d5", "1.c4 c5", "1.e4 c6"],
      answer: 0,
    },
    {
      q: "The Caro-Kann Defense starts with?",
      choices: ["1.e4 c5", "1.e4 c6", "1.e4 e5", "1.d4 Nf6"],
      answer: 1,
    },
    {
      q: "The French Defense begins?",
      choices: ["1.e4 e6", "1.e4 e5", "1.d4 d5", "1.c4 e5"],
      answer: 0,
    },
    {
      q: "'Fianchetto' refers to?",
      choices: [
        "A pawn promotion",
        "Bishop developed to b2/g2/b7/g7",
        "A rook lift",
        "A queen sacrifice",
      ],
      answer: 1,
    },
    {
      q: "The Queen's Gambit is?",
      choices: ["1.d4 d5 2.c4", "1.e4 e5 2.f4", "1.Nf3 d5", "1.c4 Nf6"],
      answer: 0,
    },
    {
      q: "The London System features?",
      choices: ["Early Bf4", "Early Bg5", "Early Bb5", "Early Bc4"],
      answer: 0,
    },
    {
      q: "The Scandinavian Defense begins?",
      choices: ["1.e4 d5", "1.e4 e5", "1.d4 d5", "1.e4 Nc6"],
      answer: 0,
    },
    {
      q: "The Grünfeld starts after?",
      choices: ["1.d4 Nf6 2.c4 g6 3.Nc3 d5", "1.e4 c5", "1.Nf3 d5", "1.d4 f5"],
      answer: 0,
    },
    {
      q: "The King's Indian Defense begins?",
      choices: ["1.d4 Nf6 2.c4 g6", "1.e4 e5", "1.c4 c5", "1.d4 d5"],
      answer: 0,
    },
    {
      q: "The Alekhine Defense begins?",
      choices: ["1.e4 Nf6", "1.d4 Nf6", "1.e4 e5", "1.c4 Nf6"],
      answer: 0,
    },
  ],
  // Tuesday — Endgames
  [
    {
      q: "K+Q vs K is generally?",
      choices: ["A draw", "A win for the queen side", "Stalemate always", "A loss"],
      answer: 1,
    },
    {
      q: "K+B+N vs K is?",
      choices: ["Impossible", "A theoretical win but tricky", "Always a draw", "Illegal"],
      answer: 1,
    },
    {
      q: "K+two bishops vs K is?",
      choices: ["A draw", "A win", "Depends on pawns", "Stalemate"],
      answer: 1,
    },
    {
      q: "K+two knights vs K is?",
      choices: ["A forced win", "Generally a draw", "Illegal", "Always stalemate"],
      answer: 1,
    },
    {
      q: "'Opposition' between kings occurs when?",
      choices: [
        "Kings face each other with one square between",
        "Kings touch",
        "Kings on same diagonal",
        "Kings on opposite corners",
      ],
      answer: 0,
    },
    {
      q: "In K+P vs K, the pawn wins if?",
      choices: [
        "Attacker's king reaches the queening square first",
        "The pawn is on rank 2",
        "Always",
        "Never",
      ],
      answer: 0,
    },
    {
      q: "A 'Lucena position' is a?",
      choices: [
        "Winning R+P vs R technique",
        "Drawing K+P vs K trick",
        "Bishop trap",
        "Knight fork",
      ],
      answer: 0,
    },
    {
      q: "The Philidor position is a?",
      choices: [
        "Drawing R+K vs R+P defense",
        "Winning technique for K+Q",
        "A pawn structure",
        "A knight endgame",
      ],
      answer: 0,
    },
    {
      q: "Bishops of opposite colors endings are famous for being?",
      choices: ["Sharp wins", "Drawish", "Always won by white", "Always losing"],
      answer: 1,
    },
    {
      q: "The 'wrong-color bishop' rule: bishop + rook-pawn draws when?",
      choices: ["Bishop can't control the queening square", "Always", "Never", "Only in blitz"],
      answer: 0,
    },
  ],
  // Wednesday — Rules
  [
    {
      q: "En passant must be played?",
      choices: [
        "Any time",
        "The move immediately after the pawn's double step",
        "Only in the endgame",
        "Only white can do it",
      ],
      answer: 1,
    },
    {
      q: "Fifty-move rule: 50 moves without…?",
      choices: ["Any move", "A capture or pawn move", "Check", "Castling"],
      answer: 1,
    },
    {
      q: "Threefold repetition means?",
      choices: [
        "Same position 3 times",
        "Same move 3 times",
        "Same piece touched 3 times",
        "3 checks in a row",
      ],
      answer: 0,
    },
    {
      q: "You cannot castle if?",
      choices: [
        "The king is in check, moves through, or into check",
        "You've moved your queen",
        "You have more than 10 pieces",
        "You are in the endgame",
      ],
      answer: 0,
    },
    {
      q: "Touch-move rule: touching your piece means?",
      choices: ["Nothing", "You must move it if legal", "You must capture", "You lose the game"],
      answer: 1,
    },
    {
      q: "A pawn on the 8th rank must be promoted to?",
      choices: ["Only a queen", "Queen, rook, bishop, or knight", "Any piece", "Another pawn"],
      answer: 1,
    },
    {
      q: "In classical time controls, 'flag fall' means?",
      choices: ["Winning by attack", "Running out of time", "Resigning", "Offering a draw"],
      answer: 1,
    },
    { q: "Stalemate is a…", choices: ["Win", "Draw", "Loss", "Restart"], answer: 1 },
    {
      q: "In FIDE rules, you can offer a draw?",
      choices: [
        "Anytime",
        "After making your own move, before pressing the clock",
        "Only in check",
        "Only after move 30",
      ],
      answer: 1,
    },
    {
      q: "Insufficient material: K+B vs K is?",
      choices: ["A win", "A draw automatically", "A loss", "Illegal"],
      answer: 1,
    },
  ],
  // Thursday — History
  [
    {
      q: "The first official World Chess Champion?",
      choices: ["Wilhelm Steinitz", "Emanuel Lasker", "José Capablanca", "Paul Morphy"],
      answer: 0,
    },
    {
      q: "How many years did Emanuel Lasker hold the title?",
      choices: ["17", "20", "27", "10"],
      answer: 2,
    },
    {
      q: "'The Match of the Century' (1972) featured?",
      choices: [
        "Fischer vs Spassky",
        "Karpov vs Kasparov",
        "Botvinnik vs Tal",
        "Alekhine vs Capablanca",
      ],
      answer: 0,
    },
    {
      q: "Deep Blue defeated which champion in 1997?",
      choices: ["Karpov", "Kasparov", "Anand", "Kramnik"],
      answer: 1,
    },
    {
      q: "Magnus Carlsen is from?",
      choices: ["Denmark", "Sweden", "Norway", "Finland"],
      answer: 2,
    },
    {
      q: "Judit Polgár is famous for being?",
      choices: [
        "A tournament organizer",
        "The strongest female player ever",
        "A chess engine author",
        "A world champion",
      ],
      answer: 1,
    },
    {
      q: "'Mikhail Tal' was known for?",
      choices: ["Positional style", "Wild sacrifices and attacks", "Endgames", "Openings theory"],
      answer: 1,
    },
    {
      q: "Anatoly Karpov's playing style?",
      choices: [
        "Sharp attacker",
        "Positional grinder",
        "Endgame specialist mainly",
        "Blitz specialist",
      ],
      answer: 1,
    },
    { q: "Viswanathan Anand is from?", choices: ["China", "India", "Iran", "Pakistan"], answer: 1 },
    {
      q: "Gukesh D became world champion by defeating?",
      choices: ["Magnus Carlsen", "Ding Liren", "Ian Nepomniachtchi", "Fabiano Caruana"],
      answer: 1,
    },
  ],
  // Friday — Notation & Concepts
  [
    {
      q: "The move 'O-O' means?",
      choices: ["Castle kingside", "Castle queenside", "Check", "Checkmate"],
      answer: 0,
    },
    {
      q: "'O-O-O' means?",
      choices: ["Kingside castle", "Queenside castle", "Draw offer", "Resign"],
      answer: 1,
    },
    {
      q: "'++' or '#' in notation means?",
      choices: ["Check", "Checkmate", "Draw", "Capture"],
      answer: 1,
    },
    {
      q: "'x' in a move like Nxe5 means?",
      choices: ["Check", "Capture", "Promotion", "En passant"],
      answer: 1,
    },
    {
      q: "'e.p.' after a move means?",
      choices: ["Extra pawn", "En passant capture", "Endgame position", "Endpoint"],
      answer: 1,
    },
    {
      q: "A '!!' after a move means?",
      choices: ["A blunder", "A brilliant move", "A dubious move", "An interesting move"],
      answer: 1,
    },
    { q: "'??' means?", choices: ["Brilliant", "Blunder", "Interesting", "Book move"], answer: 1 },
    {
      q: "'!?' means?",
      choices: ["Definitely bad", "Interesting move worth studying", "Best move", "Forced move"],
      answer: 1,
    },
    {
      q: "The '=' sign after a promotion e.g. e8=Q means?",
      choices: ["Draw", "Promotion piece", "Equal position", "En passant"],
      answer: 1,
    },
    {
      q: "The Elo rating system was invented by?",
      choices: ["Arpad Elo", "Bobby Fischer", "Wilhelm Steinitz", "Emanuel Lasker"],
      answer: 0,
    },
  ],
  // Saturday — Mixed
  [
    {
      q: "The longest known forced checkmate in a study is over?",
      choices: ["50 moves", "100 moves", "500 moves", "50000 moves"],
      answer: 2,
    },
    {
      q: "How many possible positions after both sides' first move?",
      choices: ["20", "40", "400", "4000"],
      answer: 2,
    },
    {
      q: "The 'Shannon number' estimates?",
      choices: ["Number of chess games", "Rating floor", "World ranking", "Number of pieces"],
      answer: 0,
    },
    {
      q: "'Blindfold chess' means playing?",
      choices: ["With eyes closed", "Without seeing the board", "In the dark", "One-handed"],
      answer: 1,
    },
    {
      q: "How many ranks and files on a chess board?",
      choices: ["6x6", "7x7", "8x8", "10x10"],
      answer: 2,
    },
    {
      q: "The rook's file value stays the same when?",
      choices: ["It's blocked", "It moves along a rank", "It's captured", "It castles"],
      answer: 1,
    },
    {
      q: "'Bughouse' chess is played by?",
      choices: ["1 player", "2 players", "4 players in pairs", "6 players"],
      answer: 2,
    },
    {
      q: "'960' or Fischer Random has how many starting positions?",
      choices: ["100", "500", "960", "1024"],
      answer: 2,
    },
    {
      q: "The knight's tour visits how many squares?",
      choices: ["32", "48", "64", "100"],
      answer: 2,
    },
    {
      q: "In classical time controls, a common increment is?",
      choices: ["No increment", "30 seconds per move", "5 minutes per move", "1 hour per move"],
      answer: 1,
    },
  ],
];

export function getServerTodayMarathon(): ServerMarathonQuestion[] {
  const day = new Date().getUTCDay();
  return MARATHONS[day];
}
