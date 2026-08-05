// Static content for the "How to get stars?" tab (summary of the team rules).
export type GuideSection = {
  title: string;
  intro?: string;
  bullets: string[];
};

export const STAR_GUIDE: GuideSection[] = [
  {
    title: "Win tournaments, earn stars",
    intro: "Your tournament placement multiplies the points you scored:",
    bullets: [
      "1st place → points × 4 stars",
      "2nd place → points × 3 stars",
      "3rd place → points × 2 stars",
      "Top 10 → points × 1 star",
      "The owner tells you how many stars you earned and adds them to your profile.",
    ],
  },
  {
    title: "Rules you must respect",
    bullets: [
      "At least 15 players must join the tournament.",
      "You must play every single game — miss one and you get no stars.",
      "Fair play is strictly required.",
      "Bullet tournaments give no star prizes.",
    ],
  },
  {
    title: "What you can buy with stars",
    bullets: [
      "Leader role — 20 stars",
      '"PRO" title — 30 stars',
      '"HACKER" title — 50 stars',
      '"Legend" title — 50 stars (mentioned in every team message)',
      '"One of the biggest chess star!" title — 200 stars',
      '"BRILIANT SACRIFICEman" title — 500 stars',
      "A GOLDEN STAR — 600 stars",
    ],
  },
  {
    title: "What you can buy with golden stars",
    bullets: [
      "The Golden Star of the Biggest Chess Team — 1 golden star",
      "Another chance to quit — 2 golden stars",
      "2 chances to quit — 3 golden stars",
    ],
  },
  {
    title: "Quitting: careful!",
    bullets: [
      "Quit more than 5 times in a row → you're banned from the next 2 tournaments.",
      "Go 5 tournaments without quitting → 50 free stars!",
      "A Top 10 podium of the biggest star owners is kept by the owner.",
    ],
  },
  {
    title: "Claiming your stars",
    bullets: [
      "Tell the owner after your tournament result — he writes down the stars won by each player, so nothing gets lost.",
    ],
  },
];

export const STAR_GUIDE_STUDIES: { label: string; url: string }[] = [
  { label: "Fun & instructive study #1", url: "https://lichess.org/study/2LoDtTlQ" },
  { label: "Fun & instructive study #2", url: "https://lichess.org/study/nrtHRI4c" },
  {
    label: "Study about blunders (2h of work — give it a like!)",
    url: "https://lichess.org/study/784zqtlM",
  },
];
