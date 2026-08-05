// XP milestones based on total stars earned, plus claim rewards.
export type Achievement = {
  key: string;
  label: string;
  starsRequired: number;
  xp: number;
  rewardStars: number;
  rewardGolden: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: "first_star",
    label: "First Star",
    starsRequired: 1,
    xp: 10,
    rewardStars: 1,
    rewardGolden: 0,
  },
  {
    key: "five_stars",
    label: "Rising Player",
    starsRequired: 5,
    xp: 25,
    rewardStars: 3,
    rewardGolden: 0,
  },
  {
    key: "ten_stars",
    label: "Contender",
    starsRequired: 10,
    xp: 50,
    rewardStars: 5,
    rewardGolden: 0,
  },
  {
    key: "twenty_five",
    label: "Talented",
    starsRequired: 25,
    xp: 100,
    rewardStars: 10,
    rewardGolden: 0,
  },
  {
    key: "fifty",
    label: "Sharp Mind",
    starsRequired: 50,
    xp: 200,
    rewardStars: 15,
    rewardGolden: 0,
  },
  {
    key: "hundred",
    label: "Century Club",
    starsRequired: 100,
    xp: 400,
    rewardStars: 25,
    rewardGolden: 0,
  },
  {
    key: "two_fifty",
    label: "Elite",
    starsRequired: 250,
    xp: 800,
    rewardStars: 0,
    rewardGolden: 1,
  },
  {
    key: "five_hundred",
    label: "Master",
    starsRequired: 500,
    xp: 1500,
    rewardStars: 0,
    rewardGolden: 2,
  },
  {
    key: "thousand",
    label: "Grandmaster",
    starsRequired: 1000,
    xp: 3000,
    rewardStars: 0,
    rewardGolden: 5,
  },
];

export function computeXpFromStars(totalStars: number): number {
  return ACHIEVEMENTS.filter((a) => totalStars >= a.starsRequired).reduce(
    (sum, a) => sum + a.xp,
    0,
  );
}

// XP Road: progressive milestones players unlock as they gain XP.
export type XpMilestone = {
  key: string;
  label: string;
  xpRequired: number;
  rewardStars: number;
  rewardGolden: number;
  description: string;
};

export const XP_ROAD: XpMilestone[] = [
  {
    key: "road_25",
    label: "Pawn Pusher",
    xpRequired: 25,
    rewardStars: 1,
    rewardGolden: 0,
    description: "Your very first steps.",
  },
  {
    key: "road_50",
    label: "Opening Student",
    xpRequired: 50,
    rewardStars: 2,
    rewardGolden: 0,
    description: "Learning the ropes.",
  },
  {
    key: "road_100",
    label: "Apprentice",
    xpRequired: 100,
    rewardStars: 5,
    rewardGolden: 0,
    description: "The journey begins.",
  },
  {
    key: "road_150",
    label: "Squire",
    xpRequired: 150,
    rewardStars: 6,
    rewardGolden: 0,
    description: "Steady progress.",
  },
  {
    key: "road_250",
    label: "Adept",
    xpRequired: 250,
    rewardStars: 10,
    rewardGolden: 0,
    description: "You've earned your first badge.",
  },
  {
    key: "road_350",
    label: "Tactician",
    xpRequired: 350,
    rewardStars: 12,
    rewardGolden: 0,
    description: "You see the forks now.",
  },
  {
    key: "road_500",
    label: "Veteran",
    xpRequired: 500,
    rewardStars: 0,
    rewardGolden: 1,
    description: "A shining golden reward.",
  },
  {
    key: "road_700",
    label: "Strategist",
    xpRequired: 700,
    rewardStars: 18,
    rewardGolden: 0,
    description: "Long-term plans.",
  },
  {
    key: "road_900",
    label: "Duelist",
    xpRequired: 900,
    rewardStars: 20,
    rewardGolden: 0,
    description: "Sharp in every fight.",
  },
  {
    key: "road_1000",
    label: "Champion",
    xpRequired: 1000,
    rewardStars: 25,
    rewardGolden: 0,
    description: "A serious contender now.",
  },
  {
    key: "road_1250",
    label: "Blitz Hunter",
    xpRequired: 1250,
    rewardStars: 28,
    rewardGolden: 0,
    description: "Fast and fearless.",
  },
  {
    key: "road_1500",
    label: "Endgame Artist",
    xpRequired: 1500,
    rewardStars: 30,
    rewardGolden: 1,
    description: "Converting won positions.",
  },
  {
    key: "road_1750",
    label: "Knight Errant",
    xpRequired: 1750,
    rewardStars: 35,
    rewardGolden: 0,
    description: "Roaming the board.",
  },
  {
    key: "road_2000",
    label: "Warlord",
    xpRequired: 2000,
    rewardStars: 50,
    rewardGolden: 1,
    description: "Battle-hardened.",
  },
  {
    key: "road_2500",
    label: "Rook Commander",
    xpRequired: 2500,
    rewardStars: 55,
    rewardGolden: 0,
    description: "Open files are yours.",
  },
  {
    key: "road_3000",
    label: "Bishop of Light",
    xpRequired: 3000,
    rewardStars: 60,
    rewardGolden: 1,
    description: "Long diagonals, long wins.",
  },
  {
    key: "road_3500",
    label: "Sage",
    xpRequired: 3500,
    rewardStars: 0,
    rewardGolden: 2,
    description: "Wisdom of the board.",
  },
  {
    key: "road_4000",
    label: "Queen's Favourite",
    xpRequired: 4000,
    rewardStars: 70,
    rewardGolden: 1,
    description: "Power on every square.",
  },
  {
    key: "road_4500",
    label: "Sacrifice Master",
    xpRequired: 4500,
    rewardStars: 80,
    rewardGolden: 1,
    description: "Brilliant offers, brilliant wins.",
  },
  {
    key: "road_5000",
    label: "Legend",
    xpRequired: 5000,
    rewardStars: 100,
    rewardGolden: 2,
    description: "Legendary status.",
  },
  {
    key: "road_6000",
    label: "Team Pillar",
    xpRequired: 6000,
    rewardStars: 110,
    rewardGolden: 2,
    description: "The team leans on you.",
  },
  {
    key: "road_7000",
    label: "Grand Tactician",
    xpRequired: 7000,
    rewardStars: 125,
    rewardGolden: 2,
    description: "Combinations everywhere.",
  },
  {
    key: "road_8000",
    label: "Immortal Attacker",
    xpRequired: 8000,
    rewardStars: 140,
    rewardGolden: 3,
    description: "Attacks that never end.",
  },
  {
    key: "road_9000",
    label: "Titan",
    xpRequired: 9000,
    rewardStars: 160,
    rewardGolden: 3,
    description: "Almost unstoppable.",
  },
  {
    key: "road_10000",
    label: "Mythic",
    xpRequired: 10000,
    rewardStars: 200,
    rewardGolden: 5,
    description: "You've reached the summit.",
  },
  {
    key: "road_12500",
    label: "Ascended",
    xpRequired: 12500,
    rewardStars: 240,
    rewardGolden: 5,
    description: "Beyond the summit.",
  },
  {
    key: "road_15000",
    label: "Chess Deity",
    xpRequired: 15000,
    rewardStars: 300,
    rewardGolden: 6,
    description: "A name spoken with respect.",
  },
  {
    key: "road_20000",
    label: "Eternal Champion",
    xpRequired: 20000,
    rewardStars: 400,
    rewardGolden: 8,
    description: "The end of the road… for now.",
  },
  {
    key: "road_25000",
    label: "Beyond Infinity",
    xpRequired: 25000,
    rewardStars: 500,
    rewardGolden: 10,
    description: "Nobody has come this far.",
  },
];
