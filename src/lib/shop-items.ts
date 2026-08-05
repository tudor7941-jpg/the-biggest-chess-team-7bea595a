// Catalog of built-in shop items. Owners can also add custom items via the shop_items table.
// Kept client-safe (no server-only code).

export type ShopItemKind = "title" | "chest" | "chance" | "golden_convert" | "custom";
export type Rarity = "common" | "rare" | "epic" | "legendary" | null;

export type ShopItem = {
  key: string;
  label: string;
  cost: number;
  currency: "stars" | "golden";
  description: string;
  kind: ShopItemKind;
  rarity?: Rarity;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rewardMeta?: Record<string, any>;
};

export const STAR_ITEMS: ShopItem[] = [
  {
    key: "leader_role",
    label: "Leader Role",
    cost: 20,
    currency: "stars",
    description: "Become a team leader.",
    kind: "title",
    rarity: "common",
  },
  {
    key: "pro_title",
    label: "PRO Title",
    cost: 30,
    currency: "stars",
    description: "Show off your PRO status.",
    kind: "title",
    rarity: "common",
  },
  {
    key: "hacker_title",
    label: "Hacker Title",
    cost: 50,
    currency: "stars",
    description: "The Hacker title.",
    kind: "title",
    rarity: "rare",
  },
  {
    key: "tactician_title",
    label: "Tactician",
    cost: 70,
    currency: "stars",
    description: "Master of tactical strikes.",
    kind: "title",
    rarity: "rare",
  },
  {
    key: "endgame_wizard",
    label: "Endgame Wizard",
    cost: 90,
    currency: "stars",
    description: "Turn losing positions into wins.",
    kind: "title",
    rarity: "rare",
  },
  {
    key: "legend_title",
    label: "Legend Title",
    cost: 100,
    currency: "stars",
    description: "Legend status unlocked.",
    kind: "title",
    rarity: "epic",
  },
  {
    key: "biggest_star",
    label: "One of the biggest chess team's star",
    cost: 200,
    currency: "stars",
    description: "A rare team-wide honor.",
    kind: "title",
    rarity: "epic",
  },
  {
    key: "brilliant_sacrifice",
    label: "BRILLIANT SACRIFICEman",
    cost: 500,
    currency: "stars",
    description: "For the boldest sacrifices.",
    kind: "title",
    rarity: "legendary",
  },
  {
    key: "golden_star",
    label: "Golden Star",
    cost: 600,
    currency: "stars",
    description: "Convert 600 stars into 1 golden star (auto-applied).",
    kind: "golden_convert",
    rarity: "epic",
  },
  // Chests (open instantly when owner accepts)
  {
    key: "chest_bronze",
    label: "Bronze Chest",
    cost: 30,
    currency: "stars",
    description: "5–12 stars, small chance of a golden star.",
    kind: "chest",
    rarity: "common",
    rewardMeta: { minStars: 5, maxStars: 12, goldenChance: 0.03, guaranteedGolden: 0 },
  },
  {
    key: "chest_silver",
    label: "Silver Chest",
    cost: 120,
    currency: "stars",
    description: "20–40 stars, decent chance of golden.",
    kind: "chest",
    rarity: "rare",
    rewardMeta: { minStars: 20, maxStars: 40, goldenChance: 0.1, guaranteedGolden: 0 },
  },
  {
    key: "chest_gold",
    label: "Gold Chest",
    cost: 500,
    currency: "stars",
    description: "70–140 stars, high golden chance.",
    kind: "chest",
    rarity: "epic",
    rewardMeta: { minStars: 70, maxStars: 140, goldenChance: 0.3, guaranteedGolden: 0 },
  },
];

export const GOLDEN_ITEMS: ShopItem[] = [
  {
    key: "golden_star_of_team",
    label: "The Golden Star of the Team",
    cost: 1,
    currency: "golden",
    description: "The team's ultimate honor.",
    kind: "title",
    rarity: "legendary",
  },
  {
    key: "chance_1",
    label: "Another chance to quit",
    cost: 2,
    currency: "golden",
    description: "Removes 1 gave-up count (auto).",
    kind: "chance",
  },
  {
    key: "chance_2",
    label: "2 chances to quit",
    cost: 3,
    currency: "golden",
    description: "Removes 2 gave-up counts (auto).",
    kind: "chance",
  },
  {
    key: "chest_legendary",
    label: "Legendary Chest",
    cost: 3,
    currency: "golden",
    description: "200–400 stars AND 2 guaranteed golden stars!",
    kind: "chest",
    rarity: "legendary",
    rewardMeta: { minStars: 200, maxStars: 400, goldenChance: 0, guaranteedGolden: 2 },
  },
];

export const ALL_ITEMS: ShopItem[] = [...STAR_ITEMS, ...GOLDEN_ITEMS];

export function findItem(key: string): ShopItem | undefined {
  return ALL_ITEMS.find((i) => i.key === key);
}

export const RARITY_STYLES: Record<
  Exclude<Rarity, null> | "default",
  { border: string; badge: string; label: string }
> = {
  common: { border: "border-muted", badge: "bg-muted text-muted-foreground", label: "Common" },
  rare: { border: "border-chart-3/60", badge: "bg-chart-3/20 text-chart-3", label: "Rare" },
  epic: { border: "border-primary/70", badge: "bg-primary/20 text-primary", label: "Epic" },
  legendary: {
    border: "border-[var(--color-gold)]",
    badge: "bg-[var(--color-gold)]/20 text-[var(--color-gold)]",
    label: "Legendary",
  },
  default: {
    border: "border-border",
    badge: "bg-secondary text-secondary-foreground",
    label: "Item",
  },
};
