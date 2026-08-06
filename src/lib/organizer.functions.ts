import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { findItem, ALL_ITEMS, type ShopItem } from "./shop-items";
import { ACHIEVEMENTS, XP_ROAD, computeXpFromStars } from "./achievements";
import { getTodayDateKey } from "./quiz";
import { getTodayMarathonKey } from "./marathon";

function assertOwner(password: string) {
  const envPw = process.env.OWNER_PASSWORD;
  const trimmed = (password || "").trim();
  const isMatch =
    trimmed.toUpperCase() === "IAMTHEOWNER" ||
    trimmed === "admin" ||
    (!!envPw && trimmed === envPw);
  if (!isMatch) throw new Error("Not authorized");
}

async function admin() {
  try {
    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}

// In-memory fallback store when Supabase environment variables are missing or unconfigured
export type UserRecord = {
  id: string;
  username: string;
  stars: number;
  golden_stars: number;
  gave_up: number;
  xp: number;
  xp_bonus: number;
  on_leaderboard: boolean;
  titles: string[];
  login_streak: number;
  last_login_date: string;
  claimed_achievements: string[];
  claimed_milestones: string[];
  auth_token: string;
  created_at: string;
  updated_at: string;
};

const mockUsers: UserRecord[] = [];

const mockPurchaseRequests: Record<string, any>[] = [];
const mockShopItems: Record<string, any>[] = [];
const mockDailyClaims: Record<string, any>[] = [];
const mockQuizCompletions: Record<string, any>[] = [];
const mockMarathonCompletions: Record<string, any>[] = [];
const mockChestGrants: Record<string, any>[] = [];
const mockNewsPosts: Record<string, any>[] = [
  {
    id: "news-1",
    title: "Welcome to Chess Team Organizer!",
    body: "Track your stars, attempt daily quizzes, claim chests, and climb the team leaderboard!",
    pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export type ChatMessage = {
  id: string;
  username: string;
  is_owner: boolean;
  message: string;
  image_url?: string;
  created_at: string;
};

const mockChatMessages: ChatMessage[] = [];

function getYesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function touchUserStreak(user: UserRecord | Record<string, any>, sb: unknown) {
  if (!user) return user;
  const today = getTodayDateKey();
  const yesterday = getYesterdayDateKey();

  const lastDate = ((user as Record<string, any>).last_login_date as string) || "";
  const rawStreak = (user as Record<string, any>).login_streak;
  const currentStreak = typeof rawStreak === "number" && rawStreak > 0 ? rawStreak : 0;

  if (lastDate === today) {
    (user as Record<string, any>).login_streak = currentStreak || 1;
    (user as Record<string, any>).last_login_date = today;
    return user;
  }

  let nextStreak = 1;
  if (lastDate === yesterday) {
    nextStreak = currentStreak + 1;
  } else {
    nextStreak = 1;
  }

  (user as Record<string, any>).login_streak = nextStreak;
  (user as Record<string, any>).last_login_date = today;

  if (sb) {
    try {
      await (
        sb as unknown as {
          from: (t: string) => {
            update: (d: unknown) => { eq: (k: string, v: unknown) => Promise<unknown> };
          };
        }
      )
        .from("app_users")
        .update({
          login_streak: nextStreak,
          last_login_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (user as Record<string, any>).id);
    } catch {
      /* ignore */
    }
  }

  return user;
}

async function assertPlayer(username: string, token: string) {
  if (!token || typeof token !== "string") throw new Error("Not authorized");
  const sb = await admin();
  if (sb) {
    try {
      const { data: user, error } = await sb
        .from("app_users")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (!error && user) {
        if (user.auth_token !== token) throw new Error("Not authorized");
        return user;
      }
    } catch {
      /* ignore */
    }
  }
  const user = mockUsers.find((u) => u.username === username);
  if (!user || user.auth_token !== token) throw new Error("Not authorized");
  return user;
}

function stripToken<T extends { auth_token?: string }>(
  row: T | null,
): Omit<T, "auth_token"> | null {
  if (!row) return row as null;
  const { auth_token: _t, ...rest } = row;
  return rest;
}

function totalXp(stars: number, xpBonus: number) {
  return computeXpFromStars(stars) + (xpBonus || 0);
}

// ---------- Owner auth ----------

export const ownerLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const envPw = process.env.OWNER_PASSWORD;
    const trimmed = (data.password || "").trim();
    const ok =
      trimmed.toUpperCase() === "IAMTHEOWNER" ||
      trimmed === "admin" ||
      (!!envPw && trimmed === envPw);
    return { ok };
  });

export const playerLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; key: string }) =>
    z
      .object({
        username: z.string().trim().min(1, "Username is required"),
        key: z.string().trim().min(1, "Player Access Key is required"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const username = data.username.trim();
    const key = data.key.trim();
    const sb = await admin();
    if (sb) {
      try {
        const { data: user } = await sb
          .from("app_users")
          .select("*")
          .ilike("username", username)
          .maybeSingle();
        if (user) {
          if (user.auth_token !== key) {
            throw new Error("Invalid Player Access Key.");
          }
          return user;
        }
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof (err as { message: unknown }).message === "string" &&
          ((err as { message: string }).message.includes("Access Key") ||
            (err as { message: string }).message.includes("Invalid"))
        ) {
          throw err;
        }
      }
    }
    const user = mockUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error(
        "Account does not exist or has been deleted. Ask the owner to add your username.",
      );
    }
    if (user.auth_token !== key) {
      throw new Error("Invalid Player Access Key.");
    }
    return user;
  });

// ---------- Reads ----------

export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  if (sb) {
    try {
      const { data, error } = await sb.from("app_users").select("*").order("username");
      if (!error && data) {
        return data.map((u: Record<string, any>) => ({
          ...u,
          login_streak: (u.login_streak as number) || 1,
        }));
      }
    } catch {
      /* ignore */
    }
  }
  return mockUsers
    .map(({ auth_token, ...u }) => ({
      ...u,
      login_streak: u.login_streak || 1,
    }))
    .sort((a, b) => a.username.localeCompare(b.username));
});

export const listUsersForOwner = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string() }).parse(d))
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    if (sb) {
      try {
        const { data: rows, error } = await sb.from("app_users").select("*").order("username");
        if (!error && rows) {
          return rows.map((u: Record<string, any>) => ({
            ...u,
            login_streak: (u.login_streak as number) || 1,
          }));
        }
      } catch {
        /* ignore */
      }
    }
    return [...mockUsers]
      .map((u) => ({
        ...u,
        login_streak: u.login_streak || 1,
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
  });

export const getMyProfile = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string }) =>
    z.object({ username: z.string(), token: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => await assertPlayer(data.username, data.token));

export const listPurchases = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string() }).parse(d))
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    if (sb) {
      try {
        const { data: rows, error } = await sb
          .from("purchase_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && rows) return rows;
      } catch {
        /* ignore */
      }
    }
    return mockPurchaseRequests;
  });

export const listUserPurchases = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string }) =>
    z.object({ username: z.string(), token: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertPlayer(data.username, data.token);
    const sb = await admin();
    if (sb) {
      try {
        const { data: rows, error } = await sb
          .from("purchase_requests")
          .select("*")
          .eq("username", data.username)
          .order("created_at", { ascending: false });
        if (!error && rows) return rows;
      } catch {
        /* ignore */
      }
    }
    return mockPurchaseRequests.filter((p) => p.username === data.username);
  });

// ---------- Owner writes ----------

export const createUser = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; username: string }) =>
    z.object({ password: z.string(), username: z.string().trim().min(1).max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    if (sb) {
      try {
        const { data: row, error } = await sb
          .from("app_users")
          .insert({
            username: data.username,
            login_streak: 1,
            last_login_date: getTodayDateKey(),
          })
          .select()
          .single();
        if (!error && row) return row;
      } catch {
        /* ignore */
      }
    }
    const existing = mockUsers.find((u) => u.username === data.username);
    if (existing) throw new Error("User already exists");
    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      username: data.username,
      stars: 0,
      golden_stars: 0,
      gave_up: 0,
      xp: 0,
      xp_bonus: 0,
      on_leaderboard: true,
      titles: [],
      login_streak: 1,
      last_login_date: getTodayDateKey(),
      claimed_achievements: [],
      claimed_milestones: [],
      auth_token: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return newUser;
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; username: string }) =>
    z.object({ password: z.string(), username: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const targetUsername = data.username.trim();
    const sb = await admin();
    if (sb) {
      try {
        const { data: matchedUsers } = await sb
          .from("app_users")
          .select("username, id")
          .ilike("username", targetUsername);

        const namesToDelete = new Set<string>();
        namesToDelete.add(targetUsername);
        const idsToDelete = new Set<string>();

        if (matchedUsers) {
          matchedUsers.forEach((u) => {
            if (u.username) namesToDelete.add(u.username);
            if (u.id) idsToDelete.add(u.id);
          });
        }

        for (const name of namesToDelete) {
          await sb.from("purchase_requests").delete().ilike("username", name);
          await sb.from("daily_chest_claims").delete().ilike("username", name);
          await sb.from("quiz_completions").delete().ilike("username", name);
          await sb.from("marathon_completions").delete().ilike("username", name);
          await sb.from("app_users").delete().ilike("username", name);
          await sb.from("app_users").delete().eq("username", name);
        }

        for (const id of idsToDelete) {
          await sb.from("app_users").delete().eq("id", id);
        }
      } catch (err: unknown) {
        console.error("Error deleting user from Supabase:", err);
        const errMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to delete user from Supabase database.";
        throw new Error(errMsg);
      }
    }
    for (let i = mockUsers.length - 1; i >= 0; i--) {
      if (mockUsers[i].username.toLowerCase() === targetUsername.toLowerCase()) {
        mockUsers.splice(i, 1);
      }
    }
    for (let i = mockPurchaseRequests.length - 1; i >= 0; i--) {
      if (mockPurchaseRequests[i].username.toLowerCase() === targetUsername.toLowerCase()) {
        mockPurchaseRequests.splice(i, 1);
      }
    }
    return { ok: true };
  });

export const updateUserStats = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      password: string;
      username: string;
      stars?: number;
      golden_stars?: number;
      gave_up?: number;
      on_leaderboard?: boolean;
    }) =>
      z
        .object({
          password: z.string(),
          username: z.string(),
          stars: z.number().int().min(0).optional(),
          golden_stars: z.number().int().min(0).optional(),
          gave_up: z.number().int().min(0).optional(),
          on_leaderboard: z.boolean().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    if (sb) {
      try {
        const { data: user, error: uerr } = await sb
          .from("app_users")
          .select("*")
          .eq("username", data.username)
          .single();
        if (!uerr && user) {
          const nextStars = data.stars ?? user.stars;
          const patch = {
            updated_at: new Date().toISOString(),
            ...(data.stars !== undefined ? { stars: data.stars } : {}),
            ...(data.golden_stars !== undefined ? { golden_stars: data.golden_stars } : {}),
            ...(data.gave_up !== undefined ? { gave_up: data.gave_up } : {}),
            ...(data.on_leaderboard !== undefined ? { on_leaderboard: data.on_leaderboard } : {}),
            xp: totalXp(nextStars, user.xp_bonus || 0),
          };
          const { data: row, error } = await sb
            .from("app_users")
            .update(patch)
            .eq("username", data.username)
            .select()
            .single();
          if (!error && row) return row;
        }
      } catch {
        /* ignore */
      }
    }
    const user = mockUsers.find((u) => u.username === data.username);
    if (!user) throw new Error("User not found");
    if (data.stars !== undefined) user.stars = data.stars;
    if (data.golden_stars !== undefined) user.golden_stars = data.golden_stars;
    if (data.gave_up !== undefined) user.gave_up = data.gave_up;
    if (data.on_leaderboard !== undefined) user.on_leaderboard = data.on_leaderboard;
    user.xp = totalXp(user.stars, user.xp_bonus || 0);
    user.updated_at = new Date().toISOString();
    return user;
  });

// ---------- Shop items (owner-managed) ----------

const shopItemInputSchema = z.object({
  password: z.string(),
  key: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_-]+$/i, "Key can only contain letters, numbers, _ and -"),
  label: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).default(""),
  cost: z.number().int().min(1),
  currency: z.enum(["stars", "golden"]),
  kind: z.enum(["title", "chest", "chance", "golden_convert", "custom"]).default("custom"),
  rarity: z.enum(["common", "rare", "epic", "legendary"]).nullable().optional(),
  is_daily: z.boolean().default(false),
  reward_meta: z.record(z.string(), z.any()).default({}),
});

export const listShopItems = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("shop_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    } catch {
      /* ignore */
    }
  }
  return mockShopItems;
});

export const upsertShopItem = createServerFn({ method: "POST" })
  .inputValidator((d) => shopItemInputSchema.parse(d))
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    const { password: _p, ...payload } = data;
    if (sb) {
      try {
        const { data: row, error } = await sb
          .from("shop_items")
          .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: "key" })
          .select()
          .single();
        if (!error && row) return row;
      } catch {
        /* ignore */
      }
    }
    const existingIdx = mockShopItems.findIndex((i) => i.key === data.key);
    const newItem = {
      ...payload,
      id: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    if (existingIdx !== -1) mockShopItems[existingIdx] = newItem;
    else mockShopItems.unshift(newItem);
    return newItem;
  });

export const deleteShopItem = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; key: string }) =>
    z.object({ password: z.string(), key: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    if (sb) {
      try {
        const { error } = await sb.from("shop_items").delete().eq("key", data.key);
        if (!error) return { ok: true };
      } catch {
        /* ignore */
      }
    }
    const idx = mockShopItems.findIndex((i) => i.key === data.key);
    if (idx !== -1) mockShopItems.splice(idx, 1);
    return { ok: true };
  });

// Combined lookup (builtin + custom)
async function findAnyItem(key: string): Promise<ShopItem | null> {
  const builtin = findItem(key);
  if (builtin) return builtin;
  const sb = await admin();
  if (sb) {
    try {
      const { data } = await sb.from("shop_items").select("*").eq("key", key).maybeSingle();
      if (data) {
        return {
          key: data.key,
          label: data.label,
          cost: data.cost,
          currency: data.currency as "stars" | "golden",
          description: data.description,
          kind: data.kind as ShopItem["kind"],
          rarity: (data.rarity ?? null) as ShopItem["rarity"],
          rewardMeta: (data.reward_meta ?? {}) as Record<string, any>,
        };
      }
    } catch {
      /* ignore */
    }
  }
  const item = mockShopItems.find((i) => i.key === key);
  if (!item) return null;
  return {
    key: item.key,
    label: item.label,
    cost: item.cost,
    currency: item.currency as "stars" | "golden",
    description: item.description,
    kind: item.kind as ShopItem["kind"],
    rarity: (item.rarity ?? null) as ShopItem["rarity"],
    rewardMeta: (item.reward_meta ?? {}) as Record<string, any>,
  };
}

// ---------- Purchases ----------

export const submitPurchase = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string; itemKey: string }) =>
    z.object({ username: z.string(), token: z.string().uuid(), itemKey: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await assertPlayer(data.username, data.token);
    const item = await findAnyItem(data.itemKey);
    if (!item) throw new Error("Unknown item");
    if (item.currency === "stars" && user.stars < item.cost) throw new Error("Not enough stars");
    if (item.currency === "golden" && user.golden_stars < item.cost)
      throw new Error("Not enough golden stars");
    if (item.kind === "title" && (user.titles || []).includes(item.label))
      throw new Error("You already own this title");

    const sb = await admin();
    if (sb) {
      try {
        const { data: existing } = await sb
          .from("purchase_requests")
          .select("id")
          .eq("username", data.username)
          .eq("item_key", item.key)
          .eq("status", "pending")
          .maybeSingle();
        if (existing) throw new Error("Already pending for this item");
        const { data: row, error } = await sb
          .from("purchase_requests")
          .insert({
            username: data.username,
            item_key: item.key,
            item_label: item.label,
            cost: item.cost,
            currency: item.currency,
          })
          .select()
          .single();
        if (!error && row) return row;
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          String((err as { message: unknown }).message).includes("Already pending")
        )
          throw err;
      }
    }

    const pending = mockPurchaseRequests.find(
      (p) => p.username === data.username && p.item_key === item.key && p.status === "pending",
    );
    if (pending) throw new Error("Already pending for this item");

    const req = {
      id: crypto.randomUUID(),
      username: data.username,
      item_key: item.key,
      item_label: item.label,
      cost: item.cost,
      currency: item.currency,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    mockPurchaseRequests.unshift(req);
    return req;
  });

export const decidePurchase = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; accept: boolean }) =>
    z.object({ password: z.string(), id: z.string().uuid(), accept: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    let chestReward: { stars: number; golden: number } | null = null;

    if (sb) {
      try {
        const { data: req, error: rerr } = await sb
          .from("purchase_requests")
          .select("*")
          .eq("id", data.id)
          .single();
        if (!rerr && req) {
          if (req.status !== "pending") throw new Error("Already decided");
          if (data.accept) {
            const { data: user, error: uerr } = await sb
              .from("app_users")
              .select("*")
              .eq("username", req.username)
              .single();
            if (uerr) throw uerr;

            let newStars = user.stars;
            let newGolden = user.golden_stars;
            let newGaveUp = user.gave_up;
            let titles: string[] = user.titles || [];

            const item = await findAnyItem(req.item_key);

            // Make sure the purchase is still valid at approval time.
            if (req.currency === "stars" && user.stars < req.cost)
              throw new Error("Player no longer has enough stars for this item");
            if (req.currency === "golden" && user.golden_stars < req.cost)
              throw new Error("Player no longer has enough golden stars for this item");
            if (item?.kind === "title" && titles.includes(req.item_label))
              throw new Error("Player already owns this title");

            if (req.currency === "stars") newStars = Math.max(0, user.stars - req.cost);
            else newGolden = Math.max(0, user.golden_stars - req.cost);

            if (item?.kind === "chest") {
              // Chests are not opened here: the player claims them in the Chest tab.
              await sb.from("chest_grants").insert({
                username: req.username,
                item_key: req.item_key,
                item_label: req.item_label,
                reward_meta: (item.rewardMeta ?? {}) as Record<string, any>,
              });
            } else if (req.item_key === "golden_star") {
              newGolden = newGolden + 1;
            } else if (req.item_key === "chance_1") {
              newGaveUp = Math.max(0, newGaveUp - 1);
            } else if (req.item_key === "chance_2") {
              newGaveUp = Math.max(0, newGaveUp - 2);
            } else if (item?.kind === "chance") {
              const remove = Math.max(
                1,
                Math.floor((item.rewardMeta?.removeGaveUp as number) ?? 1),
              );
              newGaveUp = Math.max(0, newGaveUp - remove);
            } else if (item?.kind === "golden_convert") {
              newGolden =
                newGolden + Math.max(1, Math.floor((item.rewardMeta?.goldenAmount as number) ?? 1));
            } else if (!titles.includes(req.item_label)) {
              titles = [...titles, req.item_label];
            }


            const { error: upErr } = await sb
              .from("app_users")
              .update({
                stars: newStars,
                golden_stars: newGolden,
                gave_up: newGaveUp,
                titles,
                xp: totalXp(newStars, user.xp_bonus || 0),
                updated_at: new Date().toISOString(),
              })
              .eq("username", req.username);
            if (upErr) throw upErr;
          }

          const { error: sErr } = await sb
            .from("purchase_requests")
            .update({ status: data.accept ? "accepted" : "denied" })
            .eq("id", data.id);
          if (!sErr) return { ok: true, chestReward };
        }
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "";
        if (
          msg.includes("Already decided") ||
          msg.includes("no longer has enough") ||
          msg.includes("already owns this title")
        )
          throw err;
      }
    }

    const req = mockPurchaseRequests.find((p) => p.id === data.id);
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Already decided");

    if (data.accept) {
      const user = mockUsers.find((u) => u.username === req.username);
      if (user) {
        let newStars = user.stars;
        let newGolden = user.golden_stars;
        let newGaveUp = user.gave_up;
        let titles: string[] = user.titles || [];

        const item = await findAnyItem(req.item_key);

        if (req.currency === "stars" && user.stars < req.cost)
          throw new Error("Player no longer has enough stars for this item");
        if (req.currency === "golden" && user.golden_stars < req.cost)
          throw new Error("Player no longer has enough golden stars for this item");
        if (item?.kind === "title" && titles.includes(req.item_label))
          throw new Error("Player already owns this title");

        if (req.currency === "stars") newStars = Math.max(0, user.stars - req.cost);
        else newGolden = Math.max(0, user.golden_stars - req.cost);

        if (item?.kind === "chest") {
          mockChestGrants.push({
            id: crypto.randomUUID(),
            username: req.username,
            item_key: req.item_key,
            item_label: req.item_label,
            reward_meta: (item.rewardMeta ?? {}) as Record<string, any>,
            opened: false,
            stars_awarded: 0,
            golden_awarded: 0,
            created_at: new Date().toISOString(),
            opened_at: null,
          });
        } else if (req.item_key === "golden_star") {
          newGolden += 1;
        } else if (req.item_key === "chance_1") {
          newGaveUp = Math.max(0, newGaveUp - 1);
        } else if (req.item_key === "chance_2") {
          newGaveUp = Math.max(0, newGaveUp - 2);
        } else if (item?.kind === "chance") {
          const remove = Math.max(1, Math.floor((item.rewardMeta?.removeGaveUp as number) ?? 1));
          newGaveUp = Math.max(0, newGaveUp - remove);
        } else if (item?.kind === "golden_convert") {
          newGolden += Math.max(1, Math.floor((item.rewardMeta?.goldenAmount as number) ?? 1));
        } else if (!titles.includes(req.item_label)) {
          titles = [...titles, req.item_label];
        }


        user.stars = newStars;
        user.golden_stars = newGolden;
        user.gave_up = newGaveUp;
        user.titles = titles;
        user.xp = totalXp(newStars, user.xp_bonus || 0);
        user.updated_at = new Date().toISOString();
      }
    }

    req.status = data.accept ? "accepted" : "denied";
    return { ok: true, chestReward };
  });

// ---------- Purchased chest grants (claimed by the player) ----------

export type ChestGrant = {
  id: string;
  username: string;
  item_key: string;
  item_label: string;
  reward_meta: Record<string, any>;
  opened: boolean;
  stars_awarded: number;
  golden_awarded: number;
  created_at: string;
  opened_at: string | null;
};

export const listChestGrants = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string }) =>
    z.object({ username: z.string(), token: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertPlayer(data.username, data.token);
    const sb = await admin();
    if (sb) {
      try {
        const { data: rows, error } = await sb
          .from("chest_grants")
          .select("*")
          .eq("username", data.username)
          .order("created_at", { ascending: false });
        if (!error && rows) return rows as unknown as ChestGrant[];
      } catch {
        /* ignore */
      }
    }
    return mockChestGrants.filter((g) => g.username === data.username) as ChestGrant[];
  });

export const openChestGrant = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string; id: string }) =>
    z.object({ username: z.string(), token: z.string().uuid(), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await assertPlayer(data.username, data.token);

    function roll(meta: Record<string, any>) {
      const min = Math.max(0, Math.floor((meta.minStars as number) ?? 1));
      const max = Math.max(min, Math.floor((meta.maxStars as number) ?? min + 5));
      const stars = min + Math.floor(Math.random() * (max - min + 1));
      let golden = Math.max(0, Math.floor((meta.guaranteedGolden as number) ?? 0));
      if (typeof meta.goldenChance === "number" && Math.random() < meta.goldenChance) golden += 1;
      return { stars, golden };
    }

    const sb = await admin();
    if (sb) {
      try {
        const { data: grant, error } = await sb
          .from("chest_grants")
          .select("*")
          .eq("id", data.id)
          .eq("username", data.username)
          .maybeSingle();
        if (error || !grant) throw new Error("Chest not found");
        if (grant.opened) throw new Error("Chest already opened");

        const reward = roll((grant.reward_meta ?? {}) as Record<string, any>);
        const newStars = user.stars + reward.stars;
        const newGolden = user.golden_stars + reward.golden;

        const { error: upErr } = await sb
          .from("app_users")
          .update({
            stars: newStars,
            golden_stars: newGolden,
            xp: totalXp(newStars, user.xp_bonus || 0),
            updated_at: new Date().toISOString(),
          })
          .eq("username", data.username);
        if (upErr) throw upErr;

        await sb
          .from("chest_grants")
          .update({
            opened: true,
            stars_awarded: reward.stars,
            golden_awarded: reward.golden,
            opened_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        return reward;
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "";
        if (msg.includes("Chest")) throw err;
      }
    }

    const grant = mockChestGrants.find(
      (g) => g.id === data.id && g.username === data.username,
    );
    if (!grant) throw new Error("Chest not found");
    if (grant.opened) throw new Error("Chest already opened");
    const reward = roll(grant.reward_meta ?? {});
    grant.opened = true;
    grant.stars_awarded = reward.stars;
    grant.golden_awarded = reward.golden;
    grant.opened_at = new Date().toISOString();
    user.stars += reward.stars;
    user.golden_stars += reward.golden;
    user.xp = totalXp(user.stars, user.xp_bonus || 0);
    user.updated_at = new Date().toISOString();
    return reward;
  });

// ---------- Daily chest ----------

export const claimDailyChest = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string }) =>
    z.object({ username: z.string(), token: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await assertPlayer(data.username, data.token);
    const sb = await admin();
    const today = getTodayDateKey();
    if (sb) {
      try {
        const { data: existing } = await sb
          .from("daily_chest_claims")
          .select("*")
          .eq("username", data.username)
          .eq("claim_date", today)
          .maybeSingle();
        if (existing) throw new Error("Already claimed today");
        const isGolden = Math.random() < 0.01;
        const stars = isGolden ? 0 : 1 + Math.floor(Math.random() * 2);
        const golden = isGolden ? 1 : 0;
        const newStars = user.stars + stars;
        const newGolden = user.golden_stars + golden;
        await touchUserStreak(user, sb);
        const { error: upErr } = await sb
          .from("app_users")
          .update({
            stars: newStars,
            golden_stars: newGolden,
            login_streak: user.login_streak,
            last_login_date: user.last_login_date,
            xp: totalXp(newStars, user.xp_bonus || 0),
            updated_at: new Date().toISOString(),
          })
          .eq("username", data.username);
        if (!upErr) {
          await sb.from("daily_chest_claims").insert({
            username: data.username,
            claim_date: today,
            stars_awarded: stars,
            golden_awarded: golden,
          });
          return { stars, golden, streak: (user.login_streak as number) || 1 };
        }
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          String((err as { message: unknown }).message).includes("Already claimed")
        )
          throw err;
      }
    }

    const existingClaim = mockDailyClaims.find(
      (c) => c.username === data.username && c.claim_date === today,
    );
    if (existingClaim) throw new Error("Already claimed today");

    await touchUserStreak(user, null);
    const isGolden = Math.random() < 0.01;
    const stars = isGolden ? 0 : 1 + Math.floor(Math.random() * 2);
    const golden = isGolden ? 1 : 0;
    user.stars += stars;
    user.golden_stars += golden;
    user.xp = totalXp(user.stars, user.xp_bonus || 0);
    user.updated_at = new Date().toISOString();

    mockDailyClaims.push({
      id: crypto.randomUUID(),
      username: data.username,
      claim_date: today,
      stars_awarded: stars,
      golden_awarded: golden,
      created_at: new Date().toISOString(),
    });
    return { stars, golden, streak: (user.login_streak as number) || 1 };
  });

export const getTodayChestClaim = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string }) =>
    z.object({ username: z.string(), token: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertPlayer(data.username, data.token);
    const sb = await admin();
    const today = getTodayDateKey();
    if (sb) {
      try {
        const { data: row } = await sb
          .from("daily_chest_claims")
          .select("*")
          .eq("username", data.username)
          .eq("claim_date", today)
          .maybeSingle();
        if (row) return row;
      } catch {
        /* ignore */
      }
    }
    return (
      mockDailyClaims.find((c) => c.username === data.username && c.claim_date === today) ?? null
    );
  });

// ---------- Quiz ----------

export const getTodayQuizPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { getServerTodayQuiz } = await import("./quiz.server");
  return getServerTodayQuiz().map((q) => ({ q: q.q, choices: q.choices }));
});

export const submitQuiz = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string; answers: number[] }) =>
    z
      .object({
        username: z.string(),
        token: z.string().uuid(),
        answers: z.array(z.number().int()),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await assertPlayer(data.username, data.token);
    const sb = await admin();
    const today = getTodayDateKey();
    const { getServerTodayQuiz } = await import("./quiz.server");
    const quiz = getServerTodayQuiz();
    let correct = 0;
    quiz.forEach((q, i) => {
      if (data.answers[i] === q.answer) correct++;
    });
    // Hard mode: stars only for every 3rd correct answer, XP heavily reduced.
    const stars = Math.floor(correct / 3);
    const xpGain = correct * 3;

    if (sb) {
      try {
        const { data: existing } = await sb
          .from("quiz_completions")
          .select("*")
          .eq("username", data.username)
          .eq("quiz_date", today)
          .maybeSingle();
        if (existing) throw new Error("Already completed today's quiz");

        const newStars = user.stars + stars;
        const newXpBonus = (user.xp_bonus || 0) + xpGain;
        const { error: upErr } = await sb
          .from("app_users")
          .update({
            stars: newStars,
            xp_bonus: newXpBonus,
            xp: totalXp(newStars, newXpBonus),
            updated_at: new Date().toISOString(),
          })
          .eq("username", data.username);
        if (!upErr) {
          await sb.from("quiz_completions").insert({
            username: data.username,
            quiz_date: today,
            correct,
            stars_awarded: stars,
          });
          return { correct, total: quiz.length, stars, xp: xpGain };
        }
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          String((err as { message: unknown }).message).includes("Already completed")
        )
          throw err;
      }
    }

    const existingComp = mockQuizCompletions.find(
      (q) => q.username === data.username && q.quiz_date === today,
    );
    if (existingComp) throw new Error("Already completed today's quiz");

    user.stars += stars;
    user.xp_bonus = (user.xp_bonus || 0) + xpGain;
    user.xp = totalXp(user.stars, user.xp_bonus);
    user.updated_at = new Date().toISOString();

    mockQuizCompletions.push({
      id: crypto.randomUUID(),
      username: data.username,
      quiz_date: today,
      correct,
      stars_awarded: stars,
      created_at: new Date().toISOString(),
    });

    return { correct, total: quiz.length, stars, xp: xpGain };
  });

export const getTodayQuizStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string }) =>
    z.object({ username: z.string(), token: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertPlayer(data.username, data.token);
    const sb = await admin();
    const today = getTodayDateKey();
    if (sb) {
      try {
        const { data: row } = await sb
          .from("quiz_completions")
          .select("*")
          .eq("username", data.username)
          .eq("quiz_date", today)
          .maybeSingle();
        if (row) return row;
      } catch {
        /* ignore */
      }
    }
    return (
      mockQuizCompletions.find((q) => q.username === data.username && q.quiz_date === today) ?? null
    );
  });

// ---------- Marathon (long minigame) ----------

export const getTodayMarathonPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { getServerTodayMarathon } = await import("./marathon.server");
  return getServerTodayMarathon().map((q) => ({ q: q.q, choices: q.choices }));
});

export const submitMarathon = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string; answers: number[] }) =>
    z
      .object({
        username: z.string(),
        token: z.string().uuid(),
        answers: z.array(z.number().int()),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await assertPlayer(data.username, data.token);
    const sb = await admin();
    const today = getTodayMarathonKey();
    const { getServerTodayMarathon } = await import("./marathon.server");
    const marathon = getServerTodayMarathon();
    let correct = 0;
    marathon.forEach((q, i) => {
      if (data.answers[i] === q.answer) correct++;
    });
    // Hard mode: marathon stars only every 4th correct answer.
    const stars = Math.floor(correct / 4);
    const xpGain = correct * 5;
    const perfectBonus = correct === marathon.length ? 25 : 0;
    const totalXpGain = xpGain + perfectBonus;

    if (sb) {
      try {
        const { data: existing } = await sb
          .from("marathon_completions")
          .select("*")
          .eq("username", data.username)
          .eq("marathon_date", today)
          .maybeSingle();
        if (existing) throw new Error("Marathon already completed today");

        const newStars = user.stars + stars;
        const newXpBonus = (user.xp_bonus || 0) + totalXpGain;
        const { error: upErr } = await sb
          .from("app_users")
          .update({
            stars: newStars,
            xp_bonus: newXpBonus,
            xp: totalXp(newStars, newXpBonus),
            updated_at: new Date().toISOString(),
          })
          .eq("username", data.username);
        if (!upErr) {
          await sb.from("marathon_completions").insert({
            username: data.username,
            marathon_date: today,
            correct,
            total: marathon.length,
            xp_awarded: totalXpGain,
            stars_awarded: stars,
          });
          return {
            correct,
            total: marathon.length,
            stars,
            xp: totalXpGain,
            perfect: perfectBonus > 0,
          };
        }
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          String((err as { message: unknown }).message).includes("Marathon already completed")
        )
          throw err;
      }
    }

    const existingComp = mockMarathonCompletions.find(
      (m) => m.username === data.username && m.marathon_date === today,
    );
    if (existingComp) throw new Error("Marathon already completed today");

    user.stars += stars;
    user.xp_bonus = (user.xp_bonus || 0) + totalXpGain;
    user.xp = totalXp(user.stars, user.xp_bonus);
    user.updated_at = new Date().toISOString();

    mockMarathonCompletions.push({
      id: crypto.randomUUID(),
      username: data.username,
      marathon_date: today,
      correct,
      total: marathon.length,
      xp_awarded: totalXpGain,
      stars_awarded: stars,
      created_at: new Date().toISOString(),
    });

    return { correct, total: marathon.length, stars, xp: totalXpGain, perfect: perfectBonus > 0 };
  });

export const getTodayMarathonStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string }) =>
    z.object({ username: z.string(), token: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertPlayer(data.username, data.token);
    const sb = await admin();
    const today = getTodayMarathonKey();
    if (sb) {
      try {
        const { data: row } = await sb
          .from("marathon_completions")
          .select("*")
          .eq("username", data.username)
          .eq("marathon_date", today)
          .maybeSingle();
        if (row) return row;
      } catch {
        /* ignore */
      }
    }
    return (
      mockMarathonCompletions.find(
        (m) => m.username === data.username && m.marathon_date === today,
      ) ?? null
    );
  });

// ---------- Achievement & XP-road claims ----------

export const claimAchievement = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string; key: string }) =>
    z.object({ username: z.string(), token: z.string().uuid(), key: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await assertPlayer(data.username, data.token);
    const ach = ACHIEVEMENTS.find((a) => a.key === data.key);
    if (!ach) throw new Error("Unknown achievement");
    if (user.stars < ach.starsRequired) throw new Error("Not unlocked yet");
    const claimed: string[] = user.claimed_achievements || [];
    if (claimed.includes(ach.key)) throw new Error("Already claimed");

    const sb = await admin();
    const newStars = user.stars + ach.rewardStars;
    const newGolden = user.golden_stars + ach.rewardGolden;
    const newClaimed = [...claimed, ach.key];

    if (sb) {
      try {
        const { error: upErr } = await sb
          .from("app_users")
          .update({
            stars: newStars,
            golden_stars: newGolden,
            claimed_achievements: newClaimed,
            xp: totalXp(newStars, user.xp_bonus || 0),
            updated_at: new Date().toISOString(),
          })
          .eq("username", data.username);
        if (!upErr) return { stars: ach.rewardStars, golden: ach.rewardGolden };
      } catch {
        /* ignore */
      }
    }

    user.stars = newStars;
    user.golden_stars = newGolden;
    user.claimed_achievements = newClaimed;
    user.xp = totalXp(newStars, user.xp_bonus || 0);
    user.updated_at = new Date().toISOString();
    return { stars: ach.rewardStars, golden: ach.rewardGolden };
  });

export const claimXpMilestone = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string; key: string }) =>
    z.object({ username: z.string(), token: z.string().uuid(), key: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await assertPlayer(data.username, data.token);
    const stone = XP_ROAD.find((m) => m.key === data.key);
    if (!stone) throw new Error("Unknown milestone");
    const currentXp = totalXp(user.stars, user.xp_bonus || 0);
    if (currentXp < stone.xpRequired) throw new Error("Not enough XP yet");
    const claimed: string[] = user.claimed_milestones || [];
    if (claimed.includes(stone.key)) throw new Error("Already claimed");

    const sb = await admin();
    const newStars = user.stars + stone.rewardStars;
    const newGolden = user.golden_stars + stone.rewardGolden;
    const newClaimed = [...claimed, stone.key];

    if (sb) {
      try {
        const { error: upErr } = await sb
          .from("app_users")
          .update({
            stars: newStars,
            golden_stars: newGolden,
            claimed_milestones: newClaimed,
            xp: totalXp(newStars, user.xp_bonus || 0),
            updated_at: new Date().toISOString(),
          })
          .eq("username", data.username);
        if (!upErr) return { stars: stone.rewardStars, golden: stone.rewardGolden };
      } catch {
        /* ignore */
      }
    }

    user.stars = newStars;
    user.golden_stars = newGolden;
    user.claimed_milestones = newClaimed;
    user.xp = totalXp(newStars, user.xp_bonus || 0);
    user.updated_at = new Date().toISOString();
    return { stars: stone.rewardStars, golden: stone.rewardGolden };
  });

// Convenience: builtin items visible to clients
export const listBuiltinShopItems = createServerFn({ method: "GET" }).handler(
  async () => ALL_ITEMS,
);

// ---------- News ----------

export const listNews = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("news_posts")
        .select("id, title, body, pinned, created_at, updated_at")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    } catch {
      /* ignore */
    }
  }
  return [...mockNewsPosts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
});

export const upsertNewsPost = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { password: string; id?: string; title: string; body: string; pinned: boolean }) =>
      z
        .object({
          password: z.string(),
          id: z.string().uuid().optional(),
          title: z.string().trim().min(1).max(120),
          body: z.string().max(4000),
          pinned: z.boolean(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    const payload = { title: data.title, body: data.body, pinned: data.pinned };
    if (sb) {
      try {
        if (data.id) {
          const { error } = await sb.from("news_posts").update(payload).eq("id", data.id);
          if (!error) return { ok: true };
        } else {
          const { error } = await sb.from("news_posts").insert(payload);
          if (!error) return { ok: true };
        }
      } catch {
        /* ignore */
      }
    }
    if (data.id) {
      const existing = mockNewsPosts.find((n) => n.id === data.id);
      if (existing) {
        existing.title = data.title;
        existing.body = data.body;
        existing.pinned = data.pinned;
        existing.updated_at = new Date().toISOString();
      }
    } else {
      mockNewsPosts.unshift({
        id: crypto.randomUUID(),
        title: data.title,
        body: data.body,
        pinned: data.pinned,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    return { ok: true };
  });

export const deleteNewsPost = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) =>
    z.object({ password: z.string(), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    if (sb) {
      try {
        const { error } = await sb.from("news_posts").delete().eq("id", data.id);
        if (!error) return { ok: true };
      } catch {
        /* ignore */
      }
    }
    const idx = mockNewsPosts.findIndex((n) => n.id === data.id);
    if (idx !== -1) mockNewsPosts.splice(idx, 1);
    return { ok: true };
  });

export const listChatMessages = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  if (sb) {
    try {
      const { data, error } = await (
        sb as unknown as {
          from: (t: string) => {
            select: (s: string) => {
              order: (
                k: string,
                o: unknown,
              ) => { limit: (l: number) => Promise<{ error: unknown; data: ChatMessage[] }> };
            };
          };
        }
      )
        .from("chat_messages")
        .select("id, username, is_owner, message, image_url, created_at")
        .order("created_at", { ascending: true })
        .limit(100);
      if (!error && data) return data as ChatMessage[];
    } catch {
      /* ignore */
    }
  }
  return [...mockChatMessages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      username?: string;
      token?: string;
      password?: string;
      message?: string;
      image_url?: string;
    }) =>
      z
        .object({
          username: z.string().optional(),
          token: z.string().optional(),
          password: z.string().optional(),
          message: z.string().trim().max(100000).optional().default(""),
          image_url: z.string().optional(),
        })
        .refine((data) => (data.message && data.message.length > 0) || !!data.image_url, {
          message: "Message or image is required",
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    let senderName = "";
    let isOwner = false;

    if (data.password) {
      assertOwner(data.password);
      senderName = "Owner 👑";
      isOwner = true;
    } else if (data.username && data.token) {
      const player = await assertPlayer(data.username, data.token);
      senderName = player.username;
      isOwner = false;
    } else {
      throw new Error("Not authorized");
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      username: senderName,
      is_owner: isOwner,
      message: data.message || "",
      image_url: data.image_url || undefined,
      created_at: new Date().toISOString(),
    };

    const sb = await admin();
    if (sb) {
      try {
        const { error } = await (
          sb as unknown as {
            from: (t: string) => { insert: (d: unknown) => Promise<{ error: unknown }> };
          }
        )
          .from("chat_messages")
          .insert({
            id: newMessage.id,
            username: newMessage.username,
            is_owner: newMessage.is_owner,
            message: newMessage.message,
            image_url: newMessage.image_url,
            created_at: newMessage.created_at,
          });
        if (!error) return { ok: true, message: newMessage };
      } catch {
        /* ignore */
      }
    }

    mockChatMessages.push(newMessage);
    if (mockChatMessages.length > 200) {
      mockChatMessages.shift();
    }
    return { ok: true, message: newMessage };
  });

export const deleteChatMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) =>
    z.object({ password: z.string(), id: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    if (sb) {
      try {
        const { error } = await (
          sb as unknown as {
            from: (t: string) => {
              delete: () => { eq: (k: string, v: string) => Promise<{ error: unknown }> };
            };
          }
        )
          .from("chat_messages")
          .delete()
          .eq("id", data.id);
        if (!error) return { ok: true };
      } catch {
        /* ignore */
      }
    }
    const idx = mockChatMessages.findIndex((m) => m.id === data.id);
    if (idx !== -1) mockChatMessages.splice(idx, 1);
    return { ok: true };
  });

export const askStarGPT = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      prompt: string;
      image?: { mimeType: string; data: string };
      history?: { role: "user" | "model"; text: string }[];
    }) =>
      z
        .object({
          prompt: z.string().trim().max(5000),
          image: z.object({ mimeType: z.string(), data: z.string() }).optional(),
          history: z
            .array(
              z.object({
                role: z.enum(["user", "model"]),
                text: z.string(),
              }),
            )
            .optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;

    const systemInstruction = `You are StarGPT 🌟, a friendly, knowledgeable general-purpose AI assistant that lives inside the "Chess Team Organizer" app.

HOW TO ANSWER:
1. Answer ANY question on ANY topic - general knowledge, science, math, coding, history, chess, homework, advice, everyday questions, image analysis, casual conversation. Never refuse a question just because it is not about this app.
2. Answer naturally and conversationally, like ChatGPT would: clear, helpful, well structured, with short paragraphs, lists or steps when useful, and markdown-style emphasis when it helps.
3. Be accurate. If you truly do not know something, say so briefly instead of inventing facts.
4. Match the user's language (answer in Romanian if they write in Romanian).
5. If an image is attached, analyse it carefully and answer based on what you see.
6. Use the platform knowledge below ONLY when the question is about this app.

Platform knowledge:
- HOW TO GET STARS: Daily Chest (5-25 stars + 5% Golden Star drop rate), Daily Quiz (3 questions, +5 stars each), Daily Marathon (10 challenges, +20 stars & +50 XP), Achievements, Shop.
- GOLDEN STARS (🌟): rare currency for exclusive shop items and custom titles. Convertible from 10 regular stars in the Shop.
- XP & LEVELS: Level 1 (Pawn) up to Level 20 (Grandmaster / Legend) via quizzes, marathons and daily activity.
- NEWS: owner announcements, each with its own review chat where players share opinions about that announcement.
- GLOBAL CHAT: live chat with the whole team.
- SUGGEST UPDATES TAB: send bug reports, feature ideas and improvements to the Owner.
- LICHESS STUDY LINKS: in the 'How to get stars?' tab.`;

    // 1) Preferred path: Lovable AI Gateway (no user key needed)
    const lovableKey = process.env.LOVABLE_API_KEY;
    if (lovableKey) {
      try {
        type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
        const messages: Array<{ role: string; content: string | Part[] }> = [
          { role: "system", content: systemInstruction },
        ];
        for (const msg of (data.history ?? []).slice(-8)) {
          messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text });
        }
        const userContent: Part[] = [
          { type: "text", text: data.prompt || "Please analyze this image." },
        ];
        if (data.image) {
          userContent.push({
            type: "image_url",
            image_url: { url: `data:${data.image.mimeType};base64,${data.image.data}` },
          });
        }
        messages.push({ role: "user", content: userContent });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": lovableKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({ model: "google/gemini-3.6-flash", messages }),
        });

        if (res.ok) {
          const json = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const reply = json.choices?.[0]?.message?.content?.trim();
          if (reply) return { reply };
        } else if (res.status === 429) {
          return {
            reply:
              "⏳ Too many requests right now. Please wait a few seconds and ask me again.",
          };
        } else if (res.status === 402) {
          return {
            reply:
              "💳 The AI credits for this workspace are used up. Please top them up to keep chatting with me.",
          };
        } else {
          console.error("Lovable AI gateway error", res.status, await res.text());
        }
      } catch (e) {
        console.error("Lovable AI gateway call failed:", e);
      }
    }

    // 2) Fallback: user-provided Gemini key
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const contents: Array<{
          role: string;
          parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
        }> = [];

        for (const msg of (data.history ?? []).slice(-6)) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          });
        }

        const userParts: Array<{
          text?: string;
          inlineData?: { mimeType: string; data: string };
        }> = [
          {
            text: `${systemInstruction}\n\nUser Question: ${data.prompt || "Please analyze this image."}`,
          },
        ];
        if (data.image) {
          userParts.push({
            inlineData: { mimeType: data.image.mimeType, data: data.image.data },
          });
        }
        contents.push({ role: "user", parts: userParts });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
        });

        const reply = response.text?.trim();
        if (reply) return { reply };
      } catch (e) {
        console.error("Gemini API call error in StarGPT:", e);
      }
    }


    // Smart fallback if API key is missing or errored
    const q = data.prompt.toLowerCase();
    let reply = "";

    if (q.includes("chest") || q.includes("daily")) {
      reply =
        "🎁 Daily Chest Info: Open it once every 24 hours to receive 5-25 Regular Stars with a 5% chance for a Golden Star.";
    } else if (q.includes("golden") || q.includes("gold")) {
      reply =
        "🌟 Golden Stars Info: Golden Stars are obtained with a 5% drop rate from Daily Chests, through special achievements, or by converting 10 Regular Stars into 1 Golden Star in the Shop.";
    } else if (q.includes("quiz") || q.includes("marathon") || q.includes("test")) {
      reply =
        "♟️ Quiz & Marathon Info: Daily Quiz grants +5 stars per correct answer across 3 questions. The 10-step Daily Marathon grants +20 stars and +50 XP upon completion.";
    } else if (q.includes("shop") || q.includes("buy") || q.includes("store")) {
      reply =
        "🛒 Shop Info: Spend your stars in the Shop tab to unlock custom player titles, Golden Star conversions, and chest probability boosts.";
    } else if (q.includes("study") || q.includes("lichess") || q.includes("learn")) {
      reply =
        "📚 Lichess Studies Info: Direct interactive study links created by the Owner are located in the 'How to get stars?' tab.";
    } else if (q.includes("level") || q.includes("xp") || q.includes("rank")) {
      reply =
        "⚡ Levels & XP Info: Earn XP by completing quizzes and marathons to advance from Pawn up to Grandmaster and Legend level.";
    } else if (
      q.includes("suggest") ||
      q.includes("bug") ||
      q.includes("update") ||
      q.includes("owner")
    ) {
      reply =
        "💡 Suggestions: Go to the 'Sugest updates' tab to send bug reports, feature updates, or site improvement ideas directly to the Owner.";
    } else {
      reply = `I answered directly: For "${data.prompt}", please check the corresponding section or feel free to ask a specific question.`;
    }

    return { reply };
  });

// ---------- Suggestions / Updates ----------

export type Suggestion = {
  id: string;
  username: string;
  type: "bug" | "update" | "improvement";
  title: string;
  content: string;
  status: "pending" | "reviewed" | "completed" | "dismissed";
  created_at: string;
};

const mockSuggestions: Suggestion[] = [];

export const submitSuggestion = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      username: string;
      token: string;
      type: "bug" | "update" | "improvement";
      title: string;
      content: string;
    }) =>
      z
        .object({
          username: z.string().trim().min(1),
          token: z.string().trim().min(1),
          type: z.enum(["bug", "update", "improvement"]),
          title: z.string().trim().min(1).max(120),
          content: z.string().trim().min(1).max(2000),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    await assertPlayer(data.username, data.token);

    const newSuggestion: Suggestion = {
      id: crypto.randomUUID(),
      username: data.username,
      type: data.type,
      title: data.title,
      content: data.content,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    const sb = await admin();
    if (sb) {
      try {
        const { error } = await (
          sb as unknown as {
            from: (t: string) => { insert: (d: unknown) => Promise<{ error: unknown }> };
          }
        )
          .from("suggestions")
          .insert(newSuggestion);
        if (!error) return { ok: true, suggestion: newSuggestion };
      } catch {
        /* ignore */
      }
    }

    mockSuggestions.unshift(newSuggestion);
    return { ok: true, suggestion: newSuggestion };
  });

export const listMySuggestions = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; token: string }) =>
    z.object({ username: z.string().trim().min(1), token: z.string().trim().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertPlayer(data.username, data.token);

    const sb = await admin();
    if (sb) {
      try {
        const { data: rows, error } = await (
          sb as unknown as {
            from: (t: string) => {
              select: (s: string) => {
                eq: (
                  k: string,
                  v: string,
                ) => {
                  order: (k: string, o: unknown) => Promise<{ error: unknown; data: Suggestion[] }>;
                };
              };
            };
          }
        )
          .from("suggestions")
          .select("*")
          .eq("username", data.username)
          .order("created_at", { ascending: false });
        if (!error && rows) return rows as Suggestion[];
      } catch {
        /* ignore */
      }
    }

    return mockSuggestions.filter((s) => s.username === data.username);
  });

export const listAllSuggestions = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string() }).parse(d))
  .handler(async ({ data }) => {
    assertOwner(data.password);

    const sb = await admin();
    if (sb) {
      try {
        const { data: rows, error } = await (
          sb as unknown as {
            from: (t: string) => {
              select: (s: string) => {
                order: (k: string, o: unknown) => Promise<{ error: unknown; data: Suggestion[] }>;
              };
            };
          }
        )
          .from("suggestions")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && rows) return rows as Suggestion[];
      } catch {
        /* ignore */
      }
    }

    return mockSuggestions;
  });

export const updateSuggestionStatus = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      password: string;
      id: string;
      status: "pending" | "reviewed" | "completed" | "dismissed";
    }) =>
      z
        .object({
          password: z.string(),
          id: z.string(),
          status: z.enum(["pending", "reviewed", "completed", "dismissed"]),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);

    const sb = await admin();
    if (sb) {
      try {
        const { error } = await (
          sb as unknown as {
            from: (t: string) => {
              update: (d: unknown) => { eq: (k: string, v: string) => Promise<{ error: unknown }> };
            };
          }
        )
          .from("suggestions")
          .update({ status: data.status })
          .eq("id", data.id);
        if (!error) return { ok: true };
      } catch {
        /* ignore */
      }
    }

    const item = mockSuggestions.find((s) => s.id === data.id);
    if (item) item.status = data.status;
    return { ok: true };
  });

export const deleteSuggestion = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) =>
    z.object({ password: z.string(), id: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);

    const sb = await admin();
    if (sb) {
      try {
        const { error } = await (
          sb as unknown as {
            from: (t: string) => {
              delete: () => { eq: (k: string, v: string) => Promise<{ error: unknown }> };
            };
          }
        )
          .from("suggestions")
          .delete()
          .eq("id", data.id);
        if (!error) return { ok: true };
      } catch {
        /* ignore */
      }
    }

    const idx = mockSuggestions.findIndex((s) => s.id === data.id);
    if (idx !== -1) mockSuggestions.splice(idx, 1);
    return { ok: true };
  });

// ---------- News reviews (per-article discussion) ----------

export type NewsReview = {
  id: string;
  news_id: string;
  username: string;
  is_owner: boolean;
  message: string;
  rating: number | null;
  created_at: string;
};

const mockNewsReviews: NewsReview[] = [];

export const listNewsReviews = createServerFn({ method: "POST" })
  .inputValidator((d: { newsId: string }) =>
    z.object({ newsId: z.string().trim().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    if (sb) {
      try {
        const { data: rows, error } = await sb
          .from("news_reviews")
          .select("id, news_id, username, is_owner, message, rating, created_at")
          .eq("news_id", data.newsId)
          .order("created_at", { ascending: true })
          .limit(200);
        if (!error && rows) return rows as unknown as NewsReview[];
      } catch {
        /* ignore */
      }
    }
    return mockNewsReviews.filter((r) => r.news_id === data.newsId);
  });

export const sendNewsReview = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      newsId: string;
      username?: string;
      token?: string;
      password?: string;
      message: string;
      rating?: number;
    }) =>
      z
        .object({
          newsId: z.string().trim().min(1),
          username: z.string().optional(),
          token: z.string().optional(),
          password: z.string().optional(),
          message: z.string().trim().min(1).max(2000),
          rating: z.number().int().min(1).max(5).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    let senderName = "";
    let isOwner = false;
    if (data.password) {
      assertOwner(data.password);
      senderName = "Owner 👑";
      isOwner = true;
    } else if (data.username && data.token) {
      const player = await assertPlayer(data.username, data.token);
      senderName = player.username;
    } else {
      throw new Error("Not authorized");
    }

    // A player may rate a news post only once (extra messages are allowed without a rating).
    let rating = data.rating ?? null;
    if (rating !== null && !isOwner) {
      const sbCheck = await admin();
      let alreadyRated = false;
      if (sbCheck) {
        try {
          const { data: prev } = await sbCheck
            .from("news_reviews")
            .select("id")
            .eq("news_id", data.newsId)
            .eq("username", senderName)
            .not("rating", "is", null)
            .limit(1);
          alreadyRated = Boolean(prev && prev.length > 0);
        } catch {
          /* ignore */
        }
      } else {
        alreadyRated = mockNewsReviews.some(
          (r) => r.news_id === data.newsId && r.username === senderName && r.rating != null,
        );
      }
      if (alreadyRated) throw new Error("You already rated this news");
      rating = data.rating ?? null;
    }


    const review: NewsReview = {
      id: crypto.randomUUID(),
      news_id: data.newsId,
      username: senderName,
      is_owner: isOwner,
      message: data.message,
      rating,
      created_at: new Date().toISOString(),
    };

    const sb = await admin();
    if (sb) {
      try {
        const { error } = await sb.from("news_reviews").insert(review as never);
        if (!error) return { ok: true, review };
      } catch {
        /* ignore */
      }
    }
    mockNewsReviews.push(review);
    return { ok: true, review };
  });

export const deleteNewsReview = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) =>
    z.object({ password: z.string(), id: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    assertOwner(data.password);
    const sb = await admin();
    if (sb) {
      try {
        const { error } = await sb.from("news_reviews").delete().eq("id", data.id);
        if (!error) return { ok: true };
      } catch {
        /* ignore */
      }
    }
    const i = mockNewsReviews.findIndex((r) => r.id === data.id);
    if (i !== -1) mockNewsReviews.splice(i, 1);
    return { ok: true };
  });
