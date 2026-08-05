import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listUsersForOwner,
  createUser,
  deleteUser,
  updateUserStats,
  listPurchases,
  decidePurchase,
  listShopItems,
  upsertShopItem,
  deleteShopItem,
  listNews,
  upsertNewsPost,
  deleteNewsPost,
  listAllSuggestions,
  updateSuggestionStatus,
  deleteSuggestion,
  type Suggestion,
} from "@/lib/organizer.functions";
import { AnimatedBackground } from "./AnimatedBackground";
import { CommunityChat } from "./CommunityChat";
import {
  Star,
  Sparkles,
  Trash2,
  Plus,
  LogOut,
  AlertCircle,
  ShoppingBag,
  Check,
  X,
  Crown,
  Trophy,
  Package,
  Megaphone,
  Lightbulb,
  Bug,
  Wrench,
  CheckCircle2,
  Clock,
  Flame,
} from "lucide-react";

type User = {
  id: string;
  username: string;
  stars: number;
  golden_stars: number;
  gave_up: number;
  xp: number;
  on_leaderboard: boolean;
  titles: string[];
  login_streak?: number;
  last_login_date?: string;
  auth_token: string;
};

type ShopRow = {
  id: string;
  key: string;
  label: string;
  description: string;
  cost: number;
  currency: string;
  kind: string;
  rarity: string | null;
  is_daily: boolean;
  reward_meta: Record<string, unknown>;
};

type NewsRow = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
};

type Purchase = {
  id: string;
  username: string;
  item_label: string;
  cost: number;
  currency: "stars" | "golden";
  status: "pending" | "accepted" | "denied";
  created_at: string;
};

export function OwnerPanel({ password, onLogout }: { password: string; onLogout: () => void }) {
  const fetchUsers = useServerFn(listUsersForOwner);
  const fetchPurchases = useServerFn(listPurchases);
  const doCreate = useServerFn(createUser);
  const doDelete = useServerFn(deleteUser);
  const doUpdate = useServerFn(updateUserStats);
  const doDecide = useServerFn(decidePurchase);
  const fetchShopItems = useServerFn(listShopItems);
  const doUpsertItem = useServerFn(upsertShopItem);
  const doDeleteItem = useServerFn(deleteShopItem);
  const fetchNews = useServerFn(listNews);
  const doUpsertNews = useServerFn(upsertNewsPost);
  const doDeleteNews = useServerFn(deleteNewsPost);
  const fetchSuggestions = useServerFn(listAllSuggestions);
  const doUpdateSuggStatus = useServerFn(updateSuggestionStatus);
  const doDeleteSugg = useServerFn(deleteSuggestion);

  const [users, setUsers] = useState<User[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [tab, setTab] = useState<
    "stats" | "shop" | "editor" | "leaderboard" | "news" | "suggestions"
  >("stats");
  const [shopRows, setShopRows] = useState<ShopRow[]>([]);
  const [newsRows, setNewsRows] = useState<NewsRow[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggFilter, setSuggFilter] = useState<string>("all");
  const [err, setErr] = useState("");

  async function refresh() {
    try {
      const [u, p, si, nw, sg] = await Promise.all([
        fetchUsers({ data: { password } }),
        fetchPurchases({ data: { password } }),
        fetchShopItems(),
        fetchNews(),
        fetchSuggestions({ data: { password } }),
      ]);
      setUsers(u as User[]);
      setPurchases(p as Purchase[]);
      setShopRows(si as ShopRow[]);
      setNewsRows(nw as NewsRow[]);
      setSuggestions(sg as Suggestion[]);
    } catch (e: unknown) {
      console.error(e);
      if (
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message: unknown }).message === "string" &&
        (e as { message: string }).message.includes("Not authorized")
      ) {
        onLogout();
      }
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedUser = users.find((u) => u.username === selected) || null;
  const pendingPurchases = purchases.filter((p) => p.status === "pending");
  const pendingByUser = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pendingPurchases) m.set(p.username, (m.get(p.username) || 0) + 1);
    return m;
  }, [pendingPurchases]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const name = newName.trim();
    if (!name) return;
    try {
      const created = await doCreate({ data: { password, username: name } });
      setNewName("");
      setSelected(name);
      await refresh();
    } catch (e) {
      setErr((e as Error).message || "Failed to add user");
    }
  }

  async function handleDelete(username: string) {
    setUsers((prev) => prev.filter((u) => u.username.toLowerCase() !== username.toLowerCase()));
    if (selected === username) setSelected(null);
    try {
      await doDelete({ data: { password, username } });
    } catch (e) {
      setErr((e as Error).message || "Failed to delete user");
    } finally {
      await refresh();
    }
  }

  async function handleStat(field: "stars" | "golden_stars" | "gave_up", value: number) {
    if (!selectedUser) return;
    await doUpdate({
      data: { password, username: selectedUser.username, [field]: Math.max(0, value) },
    });
    await refresh();
  }

  async function toggleLeaderboard(u: User) {
    await doUpdate({ data: { password, username: u.username, on_leaderboard: !u.on_leaderboard } });
    await refresh();
  }

  async function handleDecide(id: string, accept: boolean) {
    try {
      await doDecide({ data: { password, id, accept } });
      await refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-r bg-card/80 backdrop-blur-sm">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[var(--color-gold)]" />
                <span className="font-semibold">Owner</span>
              </div>
              <button
                onClick={onLogout}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleAdd} className="border-b p-3">
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New username"
                className="flex-1 rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button className="rounded-md bg-primary px-2 py-1.5 text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
          </form>

          <div className="max-h-[calc(100vh-160px)] overflow-y-auto py-2">
            {users.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No players yet. Add one above.
              </p>
            )}
            {users.map((u) => {
              const pend = pendingByUser.get(u.username) || 0;
              const gaveUpFlag = u.gave_up >= 5;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelected(u.username)}
                  className={`flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-accent ${
                    selected === u.username ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{u.username}</span>
                    {gaveUpFlag && (
                      <span title={`Gave up ${u.gave_up} times`} className="dot-red">
                        !
                      </span>
                    )}
                    {pend > 0 && (
                      <span title={`${pend} pending purchase(s)`} className="dot-green" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(u.username);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 flex gap-2">
              <TabBtn active={tab === "stats"} onClick={() => setTab("stats")}>
                Stats
              </TabBtn>
              <TabBtn active={tab === "shop"} onClick={() => setTab("shop")}>
                Shop Requests
                {pendingPurchases.length > 0 && (
                  <span className="ml-2 rounded-full bg-success px-2 py-0.5 text-xs text-primary-foreground">
                    {pendingPurchases.length}
                  </span>
                )}
              </TabBtn>
              <TabBtn active={tab === "editor"} onClick={() => setTab("editor")}>
                Shop Editor
              </TabBtn>
              <TabBtn active={tab === "leaderboard"} onClick={() => setTab("leaderboard")}>
                Leaderboard
              </TabBtn>
              <TabBtn active={tab === "news"} onClick={() => setTab("news")}>
                News
              </TabBtn>
              <TabBtn active={tab === "suggestions"} onClick={() => setTab("suggestions")}>
                User Suggestions
                {suggestions.filter((s) => s.status === "pending").length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-black font-bold">
                    {suggestions.filter((s) => s.status === "pending").length}
                  </span>
                )}
              </TabBtn>
            </div>

            {tab === "stats" && (
              <>
                {!selectedUser ? (
                  <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
                    Select a player from the sidebar to edit their stats.
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-card p-6 shadow-xl">
                    <h2 className="mb-1 text-3xl font-bold">{selectedUser.username}</h2>
                    <p className="mb-6 text-muted-foreground">
                      He gave up:{" "}
                      <span className="font-semibold text-destructive">{selectedUser.gave_up}</span>{" "}
                      times, and he has{" "}
                      <span className="font-semibold text-primary">{selectedUser.stars}</span> stars
                      and{" "}
                      <span className="font-semibold text-[var(--color-gold)]">
                        {selectedUser.golden_stars}
                      </span>{" "}
                      golden stars!
                    </p>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <NumberEdit
                        label="Stars"
                        icon={<Star className="h-4 w-4 text-primary" />}
                        value={selectedUser.stars}
                        onChange={(v) => handleStat("stars", v)}
                      />
                      <NumberEdit
                        label="Golden Stars"
                        icon={<Sparkles className="h-4 w-4 text-[var(--color-gold)]" />}
                        value={selectedUser.golden_stars}
                        onChange={(v) => handleStat("golden_stars", v)}
                      />
                      <NumberEdit
                        label="Gave Up"
                        icon={<AlertCircle className="h-4 w-4 text-destructive" />}
                        value={selectedUser.gave_up}
                        onChange={(v) => handleStat("gave_up", v)}
                      />
                    </div>

                    <div className="mt-6 rounded-lg border bg-secondary/50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          XP:{" "}
                          <span className="font-semibold text-foreground">{selectedUser.xp}</span>
                        </p>
                        <p className="flex items-center gap-1 text-sm font-bold text-orange-500">
                          <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
                          Streak: {selectedUser.login_streak || 1}d
                        </p>
                      </div>
                      {selectedUser.titles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedUser.titles.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 rounded-lg border bg-secondary/30 p-4">
                      <p className="mb-2 text-sm text-muted-foreground">Player Access Key</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded-md border bg-background px-2 py-1 font-mono text-xs">
                          {selectedUser.auth_token}
                        </code>
                        <button
                          onClick={() => navigator.clipboard?.writeText(selectedUser.auth_token)}
                          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Share this privately with {selectedUser.username}. They enter it on the
                        Player Sign-In screen.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "shop" && (
              <div className="space-y-3">
                {pendingPurchases.length === 0 && (
                  <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
                    No pending requests.
                  </div>
                )}
                {pendingPurchases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border bg-card p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {p.username} wants {p.item_label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cost: {p.cost} {p.currency === "stars" ? "stars" : "golden stars"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecide(p.id, true)}
                        className="flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
                      >
                        <Check className="h-4 w-4" /> Accept
                      </button>
                      <button
                        onClick={() => handleDecide(p.id, false)}
                        className="flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:opacity-90"
                      >
                        <X className="h-4 w-4" /> Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "editor" && (
              <ShopEditor
                rows={shopRows}
                onSave={async (item) => {
                  try {
                    await doUpsertItem({ data: { password, ...item } });
                    await refresh();
                    return true;
                  } catch (e) {
                    alert((e as Error).message);
                    return false;
                  }
                }}
                onDelete={async (key) => {
                  try {
                    await doDeleteItem({ data: { password, key } });
                    await refresh();
                  } catch (e) {
                    console.error((e as Error).message);
                  }
                }}
              />
            )}

            {tab === "leaderboard" && (
              <div className="rounded-2xl border bg-card p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[var(--color-gold)]" />
                  <h2 className="text-xl font-semibold">Leaderboard Roster</h2>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Toggle who appears in the public leaderboard.
                </p>
                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-lg border bg-secondary/40 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{u.username}</span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                          <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                          {u.login_streak || 1}d
                        </span>
                      </div>
                      <button
                        onClick={() => toggleLeaderboard(u)}
                        className={`rounded-md px-3 py-1 text-sm ${
                          u.on_leaderboard
                            ? "bg-success text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.on_leaderboard ? "On" : "Off"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "news" && (
              <div className="space-y-6">
                <NewsEditor
                  posts={newsRows}
                  onSave={async (post) => {
                    try {
                      await doUpsertNews({ data: { password, ...post } });
                      await refresh();
                      return true;
                    } catch (e) {
                      alert((e as Error).message);
                      return false;
                    }
                  }}
                  onDelete={async (id) => {
                    try {
                      await doDeleteNews({ data: { password, id } });
                      await refresh();
                    } catch (e) {
                      console.error((e as Error).message);
                    }
                  }}
                />
                <CommunityChat password={password} isOwner={true} />
              </div>
            )}

            {tab === "suggestions" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Lightbulb className="h-6 w-6 text-amber-500" />
                      User Suggestions & Bug Reports ({suggestions.length})
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Review all updates, bug reports, and feature requests submitted by players.
                    </p>
                  </div>
                  <div className="flex gap-1.5 bg-card border rounded-xl p-1 text-xs flex-wrap">
                    {(["all", "pending", "reviewed", "completed", "dismissed"] as const).map(
                      (f) => (
                        <button
                          key={f}
                          onClick={() => setSuggFilter(f)}
                          className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                            suggFilter === f
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {f === "all"
                            ? "All"
                            : f === "pending"
                              ? "Pending"
                              : f === "reviewed"
                                ? "Under Review"
                                : f === "completed"
                                  ? "Resolved"
                                  : "Dismissed"}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {suggestions.filter((s) => suggFilter === "all" || s.status === suggFilter)
                  .length === 0 ? (
                  <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
                    No suggestions found in this category.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions
                      .filter((s) => suggFilter === "all" || s.status === suggFilter)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="rounded-2xl border bg-card p-5 space-y-3 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm bg-accent px-2.5 py-0.5 rounded-md border">
                                @{s.username}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase border ${
                                  s.type === "bug"
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : s.type === "update"
                                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                }`}
                              >
                                {s.type === "bug"
                                  ? "🐛 Bug"
                                  : s.type === "update"
                                    ? "🚀 Update"
                                    : "💡 Improvement"}
                              </span>
                              <h3 className="font-bold text-base">{s.title}</h3>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(s.created_at).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-sm text-foreground bg-muted/30 p-3 rounded-xl whitespace-pre-wrap border">
                            {s.content}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Status:</span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                  s.status === "completed"
                                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                    : s.status === "reviewed"
                                      ? "bg-blue-500/15 text-blue-500 border-blue-500/30"
                                      : s.status === "dismissed"
                                        ? "bg-destructive/15 text-destructive border-destructive/30"
                                        : "bg-amber-500/15 text-amber-500 border-amber-500/30"
                                }`}
                              >
                                {s.status === "completed"
                                  ? "✅ Resolved"
                                  : s.status === "reviewed"
                                    ? "👀 Under Review"
                                    : s.status === "dismissed"
                                      ? "❌ Dismissed"
                                      : "⏳ Pending"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {s.status !== "reviewed" && (
                                <button
                                  onClick={async () => {
                                    await doUpdateSuggStatus({
                                      data: { password, id: s.id, status: "reviewed" },
                                    });
                                    refresh();
                                  }}
                                  className="rounded-lg bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 px-2.5 py-1 text-xs font-semibold border border-blue-500/30 transition-colors"
                                >
                                  Mark Under Review
                                </button>
                              )}
                              {s.status !== "completed" && (
                                <button
                                  onClick={async () => {
                                    await doUpdateSuggStatus({
                                      data: { password, id: s.id, status: "completed" },
                                    });
                                    refresh();
                                  }}
                                  className="rounded-lg bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 px-2.5 py-1 text-xs font-semibold border border-emerald-500/30 transition-colors"
                                >
                                  Mark Resolved
                                </button>
                              )}
                              {s.status !== "dismissed" && (
                                <button
                                  onClick={async () => {
                                    await doUpdateSuggStatus({
                                      data: { password, id: s.id, status: "dismissed" },
                                    });
                                    refresh();
                                  }}
                                  className="rounded-lg bg-muted text-muted-foreground hover:bg-accent px-2.5 py-1 text-xs font-semibold border transition-colors"
                                >
                                  Dismiss
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (confirm("Delete this suggestion?")) {
                                    await doDeleteSugg({ data: { password, id: s.id } });
                                    refresh();
                                  }
                                }}
                                className="rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 px-2 py-1 text-xs font-semibold transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function NumberEdit({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <div className="rounded-lg border bg-secondary/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(value - 1)}
          className="rounded-md bg-muted px-2 py-1 hover:bg-accent"
        >
          −
        </button>
        <input
          type="number"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => {
            const n = parseInt(local, 10);
            if (!isNaN(n)) onChange(n);
            else setLocal(String(value));
          }}
          className="w-full rounded-md border bg-input px-2 py-1 text-center outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => onChange(value + 1)}
          className="rounded-md bg-muted px-2 py-1 hover:bg-accent"
        >
          +
        </button>
      </div>
    </div>
  );
}

type ItemDraft = {
  key: string;
  label: string;
  description: string;
  cost: number;
  currency: "stars" | "golden";
  kind: "title" | "chest" | "chance" | "golden_convert" | "custom";
  rarity: "common" | "rare" | "epic" | "legendary" | null;
  is_daily: boolean;
  reward_meta: Record<string, unknown>;
};

const EMPTY_DRAFT: ItemDraft = {
  key: "",
  label: "",
  description: "",
  cost: 10,
  currency: "stars",
  kind: "custom",
  rarity: "common",
  is_daily: false,
  reward_meta: {},
};

function ShopEditor({
  rows,
  onSave,
  onDelete,
}: {
  rows: ShopRow[];
  onSave: (item: ItemDraft) => Promise<boolean>;
  onDelete: (key: string) => void;
}) {
  const [d, setD] = useState<ItemDraft>(EMPTY_DRAFT);
  const [minStars, setMinStars] = useState(10);
  const [maxStars, setMaxStars] = useState(30);
  const [goldenChance, setGoldenChance] = useState(5);
  const [guaranteedGolden, setGuaranteedGolden] = useState(0);

  async function save() {
    if (!d.key.trim() || !d.label.trim()) {
      alert("Key and label are required.");
      return;
    }
    const reward_meta =
      d.kind === "chest"
        ? { minStars, maxStars, goldenChance: goldenChance / 100, guaranteedGolden }
        : {};
    const ok = await onSave({ ...d, key: d.key.trim(), reward_meta });
    if (ok) setD(EMPTY_DRAFT);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Add / Update Shop Item</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Item key (unique, no spaces)">
            <input
              value={d.key}
              onChange={(e) =>
                setD({ ...d, key: e.target.value.replace(/\s+/g, "_").toLowerCase() })
              }
              placeholder="mystery_box"
              className="w-full rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Label shown to players">
            <input
              value={d.label}
              onChange={(e) => setD({ ...d, label: e.target.value })}
              placeholder="Mystery Box"
              className="w-full rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Description">
            <input
              value={d.description}
              onChange={(e) => setD({ ...d, description: e.target.value })}
              placeholder="What does it do?"
              className="w-full rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Cost">
            <input
              type="number"
              min={1}
              value={d.cost}
              onChange={(e) => setD({ ...d, cost: parseInt(e.target.value, 10) || 1 })}
              className="w-full rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Currency">
            <select
              value={d.currency}
              onChange={(e) => setD({ ...d, currency: e.target.value as ItemDraft["currency"] })}
              className="w-full rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="stars">Stars ★</option>
              <option value="golden">Golden Stars ✦</option>
            </select>
          </Field>
          <Field label="Kind">
            <select
              value={d.kind}
              onChange={(e) => setD({ ...d, kind: e.target.value as ItemDraft["kind"] })}
              className="w-full rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="custom">Custom (manual reward)</option>
              <option value="title">Title / Role</option>
              <option value="chest">Chest (auto rewards)</option>
              <option value="golden_convert">Convert to golden star</option>
              <option value="chance">Remove a gave-up count</option>
            </select>
          </Field>
          <Field label="Rarity">
            <select
              value={d.rarity ?? ""}
              onChange={(e) =>
                setD({ ...d, rarity: (e.target.value || null) as ItemDraft["rarity"] })
              }
              className="w-full rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="">None</option>
            </select>
          </Field>
          <Field label="Daily update (featured today)">
            <button
              onClick={() => setD({ ...d, is_daily: !d.is_daily })}
              className={`w-full rounded-md px-3 py-1.5 text-sm ${d.is_daily ? "bg-success text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {d.is_daily ? "Featured as Daily Update" : "Not featured"}
            </button>
          </Field>
        </div>

        {d.kind === "chest" && (
          <div className="mt-4 grid gap-3 rounded-lg border bg-secondary/30 p-4 sm:grid-cols-4">
            <Field label="Min stars">
              <input
                type="number"
                value={minStars}
                onChange={(e) => setMinStars(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border bg-input px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="Max stars">
              <input
                type="number"
                value={maxStars}
                onChange={(e) => setMaxStars(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border bg-input px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="Golden chance (%)">
              <input
                type="number"
                value={goldenChance}
                onChange={(e) => setGoldenChance(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border bg-input px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="Guaranteed golden">
              <input
                type="number"
                value={guaranteedGolden}
                onChange={(e) => setGuaranteedGolden(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border bg-input px-2 py-1.5 text-sm"
              />
            </Field>
          </div>
        )}

        <button
          onClick={save}
          className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Save Item
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Saving with an existing key updates that item.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h3 className="mb-3 font-semibold">Custom Items ({rows.length})</h3>
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No custom items yet — add one above.</p>
        )}
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-secondary/40 p-3"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {r.label}
                  {r.rarity && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase text-primary">
                      {r.rarity}
                    </span>
                  )}
                  {r.is_daily && (
                    <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] uppercase text-success">
                      Daily
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.key} · {r.cost} {r.currency === "stars" ? "★" : "✦"} · {r.kind}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() =>
                    setD({
                      key: r.key,
                      label: r.label,
                      description: r.description,
                      cost: r.cost,
                      currency: r.currency === "golden" ? "golden" : "stars",
                      kind: r.kind as ItemDraft["kind"],
                      rarity: (r.rarity ?? null) as ItemDraft["rarity"],
                      is_daily: r.is_daily,
                      reward_meta: r.reward_meta,
                    })
                  }
                  className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(r.key)}
                  className="rounded-md bg-destructive px-3 py-1 text-xs text-destructive-foreground hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NewsEditor({
  posts,
  onSave,
  onDelete,
}: {
  posts: NewsRow[];
  onSave: (post: { id?: string; title: string; body: string; pinned: boolean }) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);

  function reset() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setPinned(false);
  }

  function loadPost(p: NewsRow) {
    setEditingId(p.id);
    setTitle(p.title);
    setBody(p.body);
    setPinned(p.pinned);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const ok = await onSave({
      ...(editingId ? { id: editingId } : {}),
      title: title.trim(),
      body,
      pinned,
    });
    if (ok) reset();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            {editingId ? "Edit announcement" : "Post news to all players"}
          </h2>
        </div>
        <div className="space-y-3">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tournament this Saturday!"
              className="w-full rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Message">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Write the news every player will see in their News tab…"
              className="w-full rounded-md border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin to the top
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> {editingId ? "Save changes" : "Publish"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="rounded-2xl border bg-card p-5">
        <h3 className="mb-3 font-semibold">Published news ({posts.length})</h3>
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing published yet.</p>
        )}
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="rounded-lg border bg-secondary/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {p.pinned && <span className="mr-1 text-primary">📌</span>}
                    {p.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => loadPost(p)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
