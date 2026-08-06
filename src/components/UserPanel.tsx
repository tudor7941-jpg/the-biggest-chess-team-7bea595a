import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyProfile,
  listUsers,
  submitPurchase,
  listUserPurchases,
  claimDailyChest,
  getTodayChestClaim,
  submitQuiz,
  getTodayQuizStatus,
  getTodayQuizPublic,
  listShopItems,
  getTodayMarathonPublic,
  getTodayMarathonStatus,
  submitMarathon,
  claimAchievement,
  claimXpMilestone,
  listNews,
  submitSuggestion,
  listMySuggestions,
  type Suggestion,
} from "@/lib/organizer.functions";
import { AnimatedBackground } from "./AnimatedBackground";
import { CommunityChat } from "./CommunityChat";
import { NewsReviewChat } from "./NewsReviewChat";

import { StarGPTChat } from "./StarGPTChat";
import {
  STAR_ITEMS,
  GOLDEN_ITEMS,
  RARITY_STYLES,
  type ShopItem,
  type Rarity,
} from "@/lib/shop-items";
import { ACHIEVEMENTS, XP_ROAD } from "@/lib/achievements";
import { STAR_GUIDE, STAR_GUIDE_STUDIES } from "@/lib/star-guide";
import { type QuizQuestion } from "@/lib/quiz";
import { type MarathonQuestion } from "@/lib/marathon";
import {
  Star,
  Sparkles,
  AlertCircle,
  LogOut,
  ShoppingBag,
  Gift,
  Trophy,
  BookOpen,
  User as UserIcon,
  Award,
  Swords,
  Route as RouteIcon,
  HelpCircle,
  Megaphone,
  Pin,
  ExternalLink,
  Bot,
  X,
  Eye,
  ArrowLeft,
  Share2,
  Lightbulb,
  Bug,
  Wrench,
  CheckCircle2,
  MessageSquarePlus,
  MessageSquare,
  Flame,
  Lock,
  Clock,
  Zap,
} from "lucide-react";

type User = {
  username: string;
  stars: number;
  golden_stars: number;
  gave_up: number;
  xp: number;
  on_leaderboard: boolean;
  titles: string[];
  login_streak?: number;
  last_login_date?: string;
  claimed_achievements?: string[];
  claimed_milestones?: string[];
  auth_token?: string;
};

type UserPurchase = {
  id: string;
  item_label: string;
  cost: number;
  currency: "stars" | "golden";
  status: "pending" | "accepted" | "denied";
};

type CustomShopRow = {
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

type NewsPost = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
};

type Tab =
  | "profile"
  | "shop"
  | "chest"
  | "achievements"
  | "xproad"
  | "leaderboard"
  | "quiz"
  | "marathon"
  | "howto"
  | "news"
  | "stargpt"
  | "suggestions"
  | "chat";

export function UserPanel({
  username,
  token,
  onLogout,
}: {
  username: string;
  token: string;
  onLogout: () => void;
}) {
  const fetchMe = useServerFn(getMyProfile);
  const fetchAll = useServerFn(listUsers);
  const buy = useServerFn(submitPurchase);
  const fetchMyPurchases = useServerFn(listUserPurchases);
  const doClaim = useServerFn(claimDailyChest);
  const chestStatus = useServerFn(getTodayChestClaim);
  const doQuiz = useServerFn(submitQuiz);
  const quizStatus = useServerFn(getTodayQuizStatus);
  const fetchQuiz = useServerFn(getTodayQuizPublic);
  const fetchCustomItems = useServerFn(listShopItems);
  const fetchMarathon = useServerFn(getTodayMarathonPublic);
  const marathonStatus = useServerFn(getTodayMarathonStatus);
  const doMarathon = useServerFn(submitMarathon);
  const doClaimAch = useServerFn(claimAchievement);
  const doClaimRoad = useServerFn(claimXpMilestone);
  const fetchNews = useServerFn(listNews);
  const sendSugg = useServerFn(submitSuggestion);
  const fetchMySugg = useServerFn(listMySuggestions);

  const [me, setMe] = useState<User | null>(null);
  const [everyone, setEveryone] = useState<User[]>([]);
  const [myPurchases, setMyPurchases] = useState<UserPurchase[]>([]);
  const [tab, setTab] = useState<Tab>("profile");
  const [todayClaim, setTodayClaim] = useState<unknown>(null);
  const [todayQuiz, setTodayQuiz] = useState<unknown>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [customItems, setCustomItems] = useState<CustomShopRow[]>([]);
  const [marathonQs, setMarathonQs] = useState<MarathonQuestion[]>([]);
  const [marathonDone, setMarathonDone] = useState<unknown>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [mySuggestions, setMySuggestions] = useState<Suggestion[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [u, list, mine, cs, qs, qq, ci, mq, ms, nw, sg] = await Promise.all([
        fetchMe({ data: { username, token } }),
        fetchAll(),
        fetchMyPurchases({ data: { username, token } }),
        chestStatus({ data: { username, token } }),
        quizStatus({ data: { username, token } }),
        fetchQuiz(),
        fetchCustomItems(),
        fetchMarathon(),
        marathonStatus({ data: { username, token } }),
        fetchNews(),
        fetchMySugg({ data: { username, token } }),
      ]);
      setMe(u as User);
      setEveryone(list as User[]);
      setMyPurchases(mine as UserPurchase[]);
      setTodayClaim(cs);
      setTodayQuiz(qs);
      setQuizQuestions(qq as QuizQuestion[]);
      setCustomItems(ci as CustomShopRow[]);
      setMarathonQs(mq as MarathonQuestion[]);
      setMarathonDone(ms);
      setNews(nw as NewsPost[]);
      setMySuggestions(sg as Suggestion[]);
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
  }, [
    username,
    token,
    fetchMe,
    fetchAll,
    fetchMyPurchases,
    chestStatus,
    quizStatus,
    fetchQuiz,
    fetchCustomItems,
    fetchMarathon,
    marathonStatus,
    fetchNews,
    fetchMySugg,
    onLogout,
  ]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  const claimableAch = useMemo(() => {
    if (!me) return 0;
    const claimed = new Set(me.claimed_achievements ?? []);
    return ACHIEVEMENTS.filter((a) => me.stars >= a.starsRequired && !claimed.has(a.key)).length;
  }, [me]);

  const claimableRoad = useMemo(() => {
    if (!me) return 0;
    const claimed = new Set(me.claimed_milestones ?? []);
    return XP_ROAD.filter((m) => me.xp >= m.xpRequired && !claimed.has(m.key)).length;
  }, [me]);

  const newestNewsAt =
    news.length > 0
      ? news
          .map((n) => n.created_at)
          .sort()
          .at(-1)!
      : "";
  const [seenNewsAt, setSeenNewsAt] = useState("");
  useEffect(() => {
    try {
      setSeenNewsAt(localStorage.getItem(`cto_news_seen_${username}`) ?? "");
    } catch {
      /* ignore */
    }
  }, [username]);
  const hasUnreadNews = !!newestNewsAt && newestNewsAt > seenNewsAt;
  useEffect(() => {
    if (tab !== "news" || !newestNewsAt) return;
    setSeenNewsAt(newestNewsAt);
    try {
      localStorage.setItem(`cto_news_seen_${username}`, newestNewsAt);
    } catch {
      /* ignore */
    }
  }, [tab, newestNewsAt, username]);

  if (!me) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <UserIcon className="h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold">{me.username}</h1>
                <span className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-xs font-bold text-orange-500 shadow-xs">
                  <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500 animate-pulse" />
                  {me.login_streak || 1} Day Streak
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Chess Team Player</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex shrink-0 items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav className="rounded-2xl border bg-card/80 p-2 shadow-lg backdrop-blur lg:sticky lg:top-6 lg:w-60 lg:shrink-0">
          <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">

          <NavBtn
            a={tab === "profile"}
            onClick={() => setTab("profile")}
            icon={<UserIcon className="h-4 w-4" />}
          >
            Profile
          </NavBtn>
          <NavBtn
            a={tab === "shop"}
            onClick={() => setTab("shop")}
            icon={<ShoppingBag className="h-4 w-4" />}
          >
            Shop
          </NavBtn>
          <NavBtn
            a={tab === "chest"}
            onClick={() => setTab("chest")}
            icon={<Gift className="h-4 w-4" />}
          >
            Daily Chest
          </NavBtn>
          <NavBtn
            a={tab === "quiz"}
            onClick={() => setTab("quiz")}
            icon={<BookOpen className="h-4 w-4" />}
          >
            Daily Quiz
          </NavBtn>
          <NavBtn
            a={tab === "marathon"}
            onClick={() => setTab("marathon")}
            icon={<Swords className="h-4 w-4" />}
            badge={!marathonDone}
          >
            Marathon
          </NavBtn>
          <NavBtn
            a={tab === "achievements"}
            onClick={() => setTab("achievements")}
            icon={<Award className="h-4 w-4" />}
            badge={claimableAch > 0}
          >
            Achievements
          </NavBtn>
          <NavBtn
            a={tab === "xproad"}
            onClick={() => setTab("xproad")}
            icon={<RouteIcon className="h-4 w-4" />}
            badge={claimableRoad > 0}
          >
            XP Road
          </NavBtn>
          <NavBtn
            a={tab === "leaderboard"}
            onClick={() => setTab("leaderboard")}
            icon={<Trophy className="h-4 w-4" />}
          >
            Leaderboard
          </NavBtn>
          <NavBtn
            a={tab === "stargpt"}
            onClick={() => setTab("stargpt")}
            icon={<Bot className="h-4 w-4 text-amber-500" />}
            badge={true}
          >
            StarGPT AI
          </NavBtn>
          <NavBtn
            a={tab === "news"}
            onClick={() => setTab("news")}
            icon={<Megaphone className="h-4 w-4" />}
            badge={hasUnreadNews}
          >
            News
          </NavBtn>
          <NavBtn
            a={tab === "suggestions"}
            onClick={() => setTab("suggestions")}
            icon={<Lightbulb className="h-4 w-4 text-amber-400" />}
          >
            Suggest updates
          </NavBtn>
          <NavBtn
            a={tab === "howto"}
            onClick={() => setTab("howto")}
            icon={<HelpCircle className="h-4 w-4" />}
          >
            How to get stars?
          </NavBtn>
          <NavBtn
            a={tab === "chat"}
            onClick={() => setTab("chat")}
            icon={<MessageSquare className="h-4 w-4 text-emerald-400" />}
          >
            Global Chat
          </NavBtn>
          </div>
        </nav>

        <main className="min-w-0 flex-1 space-y-4">
        {tab === "chat" && <CommunityChat username={username} token={token} />}

        {tab === "stargpt" && <StarGPTChat username={username} token={token} />}
        {tab === "suggestions" && (
          <SuggestionsTab
            suggestions={mySuggestions}
            onRefresh={refresh}
            onSubmit={async (data) => {
              await sendSugg({
                data: {
                  username,
                  token,
                  type: data.type,
                  title: data.title,
                  content: data.content,
                },
              });
              await refresh();
            }}
          />
        )}
        {tab === "profile" && <ProfileTab me={me} />}
        {tab === "shop" && (
          <ShopTab
            me={me}
            myPurchases={myPurchases}
            customItems={customItems}
            onBuy={async (k) => {
              try {
                await buy({ data: { username, token, itemKey: k } });
                refresh();
              } catch (e) {
                alert((e as Error).message);
              }
            }}
          />
        )}
        {tab === "chest" && (
          <ChestTab
            claim={todayClaim}
            userStreak={me?.login_streak ?? 1}
            onClaim={async () => {
              try {
                const r = await doClaim({ data: { username, token } });
                if (r && typeof r === "object" && "streak" in r && typeof r.streak === "number") {
                  const newStreak = r.streak as number;
                  setMe((prev) => (prev ? { ...prev, login_streak: newStreak } : prev));
                }
                refresh();
                return r;
              } catch (e) {
                alert((e as Error).message);
                return null;
              }
            }}
          />
        )}
        {tab === "quiz" && (
          <QuizTab
            quiz={quizQuestions}
            status={todayQuiz}
            onSubmit={async (answers) => {
              try {
                const r = await doQuiz({ data: { username, token, answers } });
                refresh();
                return r;
              } catch (e) {
                alert((e as Error).message);
                return null;
              }
            }}
          />
        )}
        {tab === "marathon" && (
          <MarathonTab
            questions={marathonQs}
            status={marathonDone}
            onSubmit={async (answers) => {
              try {
                const r = await doMarathon({ data: { username, token, answers } });
                refresh();
                return r;
              } catch (e) {
                alert((e as Error).message);
                return null;
              }
            }}
          />
        )}
        {tab === "achievements" && (
          <AchievementsTab
            me={me}
            onClaim={async (key) => {
              try {
                await doClaimAch({ data: { username, token, key } });
                refresh();
              } catch (e) {
                alert((e as Error).message);
              }
            }}
          />
        )}
        {tab === "xproad" && (
          <XpRoadTab
            me={me}
            onClaim={async (key) => {
              try {
                await doClaimRoad({ data: { username, token, key } });
                refresh();
              } catch (e) {
                alert((e as Error).message);
              }
            }}
          />
        )}
        {tab === "leaderboard" && <LeaderboardTab users={everyone} me={me} />}
        {tab === "news" && <NewsTab posts={news} username={username} token={token} />}
        {tab === "howto" && <HowToGetStarsTab />}
        </main>
        </div>
      </div>

    </div>
  );
}

function NavBtn({
  a,
  onClick,
  icon,
  children,
  badge,
}: {
  a: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={a ? "page" : undefined}
      className={`relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
        a
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-foreground hover:bg-accent hover:translate-x-0.5"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
      {badge && <span className="dot-green-badge absolute right-1.5 top-1.5">!</span>}
    </button>
  );
}


function ProfileTab({ me }: { me: User }) {
  const streak = me.login_streak || 1;
  return (
    <div className="rounded-2xl border bg-card p-8 text-center shadow-xl">
      <p className="text-lg text-muted-foreground">
        He gave up: <span className="font-bold text-destructive">{me.gave_up}</span> times,
      </p>
      <p className="mt-2 text-lg text-muted-foreground">
        and he has <span className="font-bold text-primary">{me.stars}</span> stars and{" "}
        <span className="font-bold text-[var(--color-gold)]">{me.golden_stars}</span> golden stars!
      </p>
      <p className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm font-semibold text-orange-500">
        <Flame className="h-4 w-4 fill-orange-500 text-orange-500 animate-pulse" />
        Daily Login Streak: {streak} {streak === 1 ? "day" : "days"}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard icon={<Star className="h-5 w-5 text-primary" />} label="Stars" value={me.stars} />
        <StatCard
          icon={<Sparkles className="h-5 w-5 text-[var(--color-gold)]" />}
          label="Golden"
          value={me.golden_stars}
        />
        <StatCard icon={<Award className="h-5 w-5 text-chart-3" />} label="XP" value={me.xp} />
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-500 fill-orange-500/20" />}
          label="Streak"
          value={streak}
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-destructive" />}
          label="Gave Up"
          value={me.gave_up}
        />
      </div>
      {me.titles.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm text-muted-foreground">Titles & Roles</p>
          <div className="flex flex-wrap justify-center gap-2">
            {me.titles.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-3 py-1 text-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
      {me.auth_token && (
        <div className="mt-6 rounded-xl border bg-secondary/30 p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Player Access Key
              </p>
              <p className="text-xs text-muted-foreground">
                Keep this key safe to sign in on other devices or saved sessions.
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(me.auth_token!)}
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              Copy Key
            </button>
          </div>
          <code className="mt-2 block w-full truncate rounded border bg-background p-2 font-mono text-xs">
            {me.auth_token}
          </code>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-secondary/40 p-4">
      <div className="mb-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ShopTab({
  me,
  myPurchases,
  customItems,
  onBuy,
}: {
  me: User;
  myPurchases: UserPurchase[];
  customItems: CustomShopRow[];
  onBuy: (key: string) => void;
}) {
  const pending = new Set(
    myPurchases.filter((p) => p.status === "pending").map((p) => p.item_label),
  );

  const mapped: ShopItem[] = customItems.map((c) => ({
    key: c.key,
    label: c.label,
    cost: c.cost,
    currency: (c.currency === "golden" ? "golden" : "stars") as "stars" | "golden",
    description: c.description,
    kind: c.kind as ShopItem["kind"],
    rarity: (c.rarity ?? null) as Rarity,
    rewardMeta: c.reward_meta,
  }));
  const dailyKeys = new Set(customItems.filter((c) => c.is_daily).map((c) => c.key));
  const daily = mapped.filter((i) => dailyKeys.has(i.key));
  const customStars = mapped.filter((i) => !dailyKeys.has(i.key) && i.currency === "stars");
  const customGolden = mapped.filter((i) => !dailyKeys.has(i.key) && i.currency === "golden");

  return (
    <div className="space-y-6">
      {daily.length > 0 && (
        <ShopSection
          title="✨ Daily Updates"
          subtitle="Fresh items posted by the owner — grab them while they're here."
          balance={me.stars}
          icon={<Sparkles className="h-5 w-5 text-[var(--color-gold)]" />}
          items={daily}
          pending={pending}
          onBuy={onBuy}
          balanceUnit="stars"
          userStars={me.stars}
          userGolden={me.golden_stars}
        />
      )}
      <ShopSection
        title="Buy with Stars"
        balance={me.stars}
        icon={<Star className="h-5 w-5 text-primary" />}
        items={[...STAR_ITEMS, ...customStars]}
        pending={pending}
        onBuy={onBuy}
        balanceUnit="stars"
        userStars={me.stars}
        userGolden={me.golden_stars}
      />
      <ShopSection
        title="Buy with Golden Stars"
        balance={me.golden_stars}
        icon={<Sparkles className="h-5 w-5 text-[var(--color-gold)]" />}
        items={[...GOLDEN_ITEMS, ...customGolden]}
        pending={pending}
        onBuy={onBuy}
        balanceUnit="golden stars"
        userStars={me.stars}
        userGolden={me.golden_stars}
      />
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="mb-3 font-semibold">My Purchases</h3>
        {myPurchases.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
        <div className="space-y-2">
          {myPurchases.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border bg-secondary/40 px-3 py-2 text-sm"
            >
              <span>{p.item_label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  p.status === "pending"
                    ? "bg-warning/20 text-warning"
                    : p.status === "accepted"
                      ? "bg-success/20 text-success"
                      : "bg-destructive/20 text-destructive"
                }`}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShopSection({
  title,
  subtitle,
  balance,
  icon,
  items,
  pending,
  onBuy,
  balanceUnit,
  userStars,
  userGolden,
}: {
  title: string;
  subtitle?: string;
  balance: number;
  icon: React.ReactNode;
  items: ShopItem[];
  pending: Set<string>;
  onBuy: (k: string) => void;
  balanceUnit: string;
  userStars: number;
  userGolden: number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="font-semibold">{title}</h2>
          </div>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <span className="text-sm text-muted-foreground">
          Balance: <span className="font-bold text-foreground">{balance}</span> {balanceUnit}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => {
          const isPending = pending.has(it.label);
          const canAfford = it.currency === "stars" ? userStars >= it.cost : userGolden >= it.cost;
          const style =
            RARITY_STYLES[(it.rarity ?? "default") as keyof typeof RARITY_STYLES] ??
            RARITY_STYLES.default;
          return (
            <div key={it.key} className={`rounded-lg border-2 bg-secondary/30 p-3 ${style.border}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{it.label}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${style.badge}`}
                >
                  {style.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{it.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm">
                  {it.cost} {it.currency === "stars" ? "★" : "✦"}
                </span>
                <button
                  disabled={isPending || !canAfford}
                  onClick={() => onBuy(it.key)}
                  className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPending ? "Pending…" : canAfford ? "Buy" : "Can't afford"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function playChestFanfare() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Charge Rumble
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(70, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 1.4);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 1.2);
    gain1.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 1.5);

    // Sigma Arpeggio Victory Chord (C - E - G - C - E - G)
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + 1.35 + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 1.0);
    });
  } catch {
    // Web Audio may be restricted before user gesture
  }
}

function MidnightCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diffMs = tomorrow.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft("00:00:00");
        return;
      }
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`,
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-500 shadow-sm">
      <Clock className="h-4 w-4 text-amber-400" />
      <span>Resets in: {timeLeft}</span>
    </div>
  );
}

function ChestTab({
  claim,
  onClaim,
  userStreak = 1,
  grants = [],
  onOpenGrant,
}: {
  claim: { stars_awarded: number; golden_awarded: number } | null | unknown;
  onClaim: () => Promise<{ stars: number; golden: number; streak?: number } | null>;
  userStreak?: number;
  grants?: ChestGrantRow[];
  onOpenGrant?: (id: string) => Promise<{ stars: number; golden: number } | null>;
}) {
  const [state, setState] = useState<"idle" | "shaking" | "open" | "claimed">("idle");
  const [reward, setReward] = useState<{ stars: number; golden: number; streak?: number } | null>(
    null,
  );
  const justOpenedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef(true);

  const isAlreadyClaimed = Boolean(claim && typeof claim === "object" && "stars_awarded" in claim);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isAlreadyClaimed) {
      const c = claim as { stars_awarded: number; golden_awarded: number };
      setReward(
        (prev) => prev ?? { stars: c.stars_awarded, golden: c.golden_awarded, streak: userStreak },
      );
      // Don't interrupt the opening animation that is running right now.
      if (!justOpenedRef.current) setState("claimed");
    } else {
      justOpenedRef.current = false;
      setState("idle");
      setReward(null);
    }
  }, [claim, isAlreadyClaimed, userStreak]);

  async function handle() {
    if (isAlreadyClaimed || state !== "idle") return;
    playChestFanfare();
    justOpenedRef.current = true;
    setState("shaking");

    let result: { stars: number; golden: number; streak?: number } | null = null;
    try {
      result = await onClaim();
    } catch {
      result = null;
    }

    // Let the shake animation play out fully (1.6s) before revealing.
    timerRef.current = setTimeout(() => {
      if (!aliveRef.current) return;
      if (result) {
        setReward(result);
        setState("open");
      } else {
        justOpenedRef.current = false;
        setState(isAlreadyClaimed ? "claimed" : "idle");
      }
    }, 1600);
  }

  const stateClass =
    state === "idle"
      ? "chest-idle"
      : state === "shaking"
        ? "chest-shaking"
        : state === "open"
          ? "chest-open"
          : "chest-claimed";


  return (
    <div className="space-y-4">
    <div className="rounded-2xl border bg-card p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <h2 className="mb-1 text-3xl font-extrabold bg-gradient-to-r from-amber-400 via-primary to-amber-500 bg-clip-text text-transparent tracking-tight">
          Daily Sigma Chest
        </h2>
        <p className="mb-6 text-sm text-muted-foreground font-medium">
          Claim daily rewards to keep your{" "}
          <span className="text-orange-500 font-bold">🔥 Daily Streak</span> alive!
        </p>

        {state === "claimed" && (
          <div className="mb-8 rounded-2xl bg-secondary/50 border border-amber-500/20 p-6 text-center max-w-md mx-auto shadow-inner space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 mb-1">
              <Lock className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">DAILY CHEST LOCKED</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You have already claimed your daily chest for today!
              </p>
            </div>

            <MidnightCountdown />

            <div className="pt-2 border-t border-border/50 flex items-center justify-around text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Today's Claim</span>
                <span className="font-bold text-amber-400">
                  {reward && reward.stars > 0 ? `+${reward.stars} ★` : ""}
                  {reward && reward.golden > 0 ? ` +${reward.golden} ✦` : ""}
                  {!reward || (reward.stars === 0 && reward.golden === 0) ? "Claimed" : ""}
                </span>
              </div>
              <div className="h-8 w-px bg-border/60" />
              <div>
                <span className="text-muted-foreground block text-[11px]">Active Streak</span>
                <span className="font-bold text-orange-500 flex items-center gap-1 justify-center">
                  <Flame className="h-3.5 w-3.5 fill-orange-500" /> {userStreak} Days
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={`chest-stage mx-auto my-6 ${stateClass}`}>
          {state === "open" && <div className="chest-rays" />}
          {state === "open" && <div className="chest-open-burst" />}
          {state === "open" && (
            <div className="chest-sigma-star">
              <Star className="h-20 w-20 fill-amber-400 text-amber-200 drop-shadow-[0_0_25px_rgba(251,191,36,0.9)] animate-bounce" />
            </div>
          )}
          <div className="chest-body">
            <div className="chest-lock" />
          </div>
          <div className="chest-lid" />
          {state === "open" && (
            <div className="chest-particles">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="chest-particle" />
              ))}
            </div>
          )}
        </div>

        {state === "open" && reward && (
          <div className="reward-pop mt-8 p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-background to-secondary/40 animate-in fade-in zoom-in-75 duration-500 max-w-md mx-auto shadow-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" /> EPIC CHEST UNLOCKED!
            </div>

            <div className="flex justify-center items-center gap-6 py-2">
              {reward.stars > 0 && (
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-black text-amber-400 flex items-center gap-1 drop-shadow-md">
                    <Star className="h-8 w-8 text-amber-400 fill-amber-400" /> +{reward.stars}
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                    Stars
                  </span>
                </div>
              )}
              {reward.golden > 0 && (
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-black text-[var(--color-gold)] flex items-center gap-1 drop-shadow-md">
                    <Sparkles className="h-8 w-8 text-[var(--color-gold)] fill-[var(--color-gold)]" />{" "}
                    +{reward.golden}
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                    Golden Star
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-orange-500/15 border border-orange-500/30 p-3 flex items-center justify-center gap-2 text-orange-500 dark:text-orange-400 font-extrabold text-sm">
              <Flame className="h-5 w-5 fill-orange-500 animate-pulse" />
              🔥 STREAK INCREASED! CURRENT STREAK: {reward.streak ?? userStreak} DAYS
            </div>

            <p className="text-xs text-muted-foreground font-medium pt-2">
              Awesome job! Switching tabs or exiting will show the chest as locked until tomorrow.
            </p>
          </div>
        )}

        {state === "idle" && !isAlreadyClaimed && (
          <div className="mt-8 space-y-3">
            <button
              onClick={handle}
              disabled={false}
              className="relative inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-primary to-amber-600 px-8 py-4 text-base font-extrabold text-primary-foreground shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100"
            >
              <Sparkles className="h-5 w-5 animate-spin-slow" />
              <span>OPEN DAILY CHEST</span>
            </button>
            <p className="text-xs text-muted-foreground font-medium">
              Claiming updates your daily streak!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizTab({
  quiz,
  status,
  onSubmit,
}: {
  quiz: QuizQuestion[];
  status: { correct: number; stars_awarded: number } | null | unknown;
  onSubmit: (
    answers: number[],
  ) => Promise<{ correct: number; total: number; stars: number; xp?: number } | null>;
}) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{
    correct: number;
    total: number;
    stars: number;
    xp?: number;
  } | null>(null);

  useEffect(() => {
    if (status && typeof status === "object" && "correct" in status) {
      const s = status as { correct: number; stars_awarded: number };
      setResult({ correct: s.correct, total: quiz.length, stars: s.stars_awarded });
    }
  }, [status, quiz.length]);

  if (result) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold">Today's Quiz</h2>
        <p className="text-muted-foreground">
          You scored{" "}
          <span className="font-bold text-foreground">
            {result.correct} / {result.total}
          </span>
        </p>
        <p className="mt-2 text-lg">
          + {result.stars} <Star className="inline h-4 w-4 text-primary" /> stars
        </p>
        {result.xp !== undefined && <p className="mt-1 text-lg">+ {result.xp} XP</p>}
        <p className="mt-6 text-sm text-muted-foreground">A new quiz is available every day.</p>
      </div>
    );
  }

  async function handleSubmit() {
    if (answers.length < quiz.length || answers.some((a) => a === undefined)) {
      alert("Answer every question first.");
      return;
    }
    const r = await onSubmit(answers);
    if (r) setResult(r);
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="mb-1 text-xl font-bold">Today's Chess Quiz</h2>
      <p className="mb-4 text-sm text-muted-foreground">2 stars and 15 XP per correct answer.</p>
      <div className="space-y-5">
        {quiz.map((q, qi) => (
          <div key={qi}>
            <p className="mb-2 font-medium">
              {qi + 1}. {q.q}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.choices.map((c, ci) => (
                <button
                  key={ci}
                  onClick={() => {
                    const next = [...answers];
                    next[qi] = ci;
                    setAnswers(next);
                  }}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    answers[qi] === ci
                      ? "border-primary bg-primary/20"
                      : "bg-secondary/40 hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="mt-6 w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:opacity-90"
      >
        Submit Quiz
      </button>
    </div>
  );
}

type MarathonResult = {
  correct: number;
  total: number;
  stars: number;
  xp: number;
  perfect: boolean;
};

function MarathonTab({
  questions,
  status,
  onSubmit,
}: {
  questions: MarathonQuestion[];
  status:
    { correct: number; total: number; stars_awarded: number; xp_awarded: number } | null | unknown;
  onSubmit: (answers: number[]) => Promise<MarathonResult | null>;
}) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<MarathonResult | null>(null);

  useEffect(() => {
    if (status && typeof status === "object" && "correct" in status) {
      const s = status as {
        correct: number;
        total: number;
        stars_awarded: number;
        xp_awarded: number;
      };
      setResult({
        correct: s.correct,
        total: s.total,
        stars: s.stars_awarded,
        xp: s.xp_awarded,
        perfect: s.correct === s.total,
      });
    }
  }, [status]);

  if (result) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold">Chess Marathon</h2>
        <p className="text-muted-foreground">
          You scored{" "}
          <span className="font-bold text-foreground">
            {result.correct} / {result.total}
          </span>
        </p>
        <p className="mt-2 text-lg">
          + {result.xp} XP · + {result.stars} <Star className="inline h-4 w-4 text-primary" />
        </p>
        {result.perfect && (
          <p className="mt-2 font-semibold text-[var(--color-gold)]">Perfect run! +100 bonus XP</p>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          A brand-new marathon unlocks every day.
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
        Loading marathon…
      </div>
    );
  }

  const q = questions[step];
  const answered = answers[step] !== undefined;
  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Chess Marathon</h2>
          <p className="text-sm text-muted-foreground">
            10 hard questions · 25 XP each · +100 XP perfect bonus
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm">
          {step + 1} / {questions.length}
        </span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((step + 1) / questions.length) * 100}%` }}
        />
      </div>

      <p className="mb-3 font-medium">{q.q}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.choices.map((c, ci) => (
          <button
            key={ci}
            onClick={() => {
              const next = [...answers];
              next[step] = ci;
              setAnswers(next);
            }}
            className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              answers[step] === ci
                ? "border-primary bg-primary/20"
                : "bg-secondary/40 hover:bg-accent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-40"
        >
          Back
        </button>
        {step < questions.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!answered}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            onClick={async () => {
              const r = await onSubmit(answers);
              if (r) setResult(r);
            }}
            disabled={!allAnswered}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Finish Marathon
          </button>
        )}
      </div>
    </div>
  );
}

function AchievementsTab({ me, onClaim }: { me: User; onClaim: (key: string) => void }) {
  const claimed = new Set(me.claimed_achievements ?? []);
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="mb-1 text-xl font-bold">Achievements</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Earn XP as you collect stars, then claim your reward.
      </p>
      <div className="space-y-2">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = me.stars >= a.starsRequired;
          const isClaimed = claimed.has(a.key);
          return (
            <div
              key={a.key}
              className={`flex items-center justify-between rounded-lg border p-3 transition-opacity ${unlocked ? "bg-success/10" : "bg-secondary/30 opacity-60"}`}
            >
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {a.label}
                  {unlocked && !isClaimed && <span className="dot-green-badge relative">!</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reach {a.starsRequired} stars · reward{" "}
                  {a.rewardStars > 0 ? `${a.rewardStars} ★` : ""}
                  {a.rewardGolden > 0 ? ` ${a.rewardGolden} ✦` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <p className="text-sm font-semibold">+{a.xp} XP</p>
                {unlocked && !isClaimed && (
                  <button
                    onClick={() => onClaim(a.key)}
                    className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Claim
                  </button>
                )}
                {isClaimed && <span className="text-xs text-success">✓ Claimed</span>}
              </div>
            </div>
          );
        })}
        <p className="pt-2 text-right text-sm text-muted-foreground">
          Total XP: <span className="font-bold text-foreground">{me.xp}</span>
        </p>
      </div>
    </div>
  );
}

function XpRoadTab({ me, onClaim }: { me: User; onClaim: (key: string) => void }) {
  const claimed = new Set(me.claimed_milestones ?? []);
  const maxXp = XP_ROAD[XP_ROAD.length - 1].xpRequired;
  const progress = Math.min(100, (me.xp / maxXp) * 100);
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="mb-1 text-xl font-bold">XP Road</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Spend nothing — just level up. Every milestone hands you stars, golden stars and a new rank.
        You have <span className="font-bold text-foreground">{me.xp} XP</span>.
      </p>

      <div className="xp-road-track mb-6">
        <div className="xp-road-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-3">
        {XP_ROAD.map((m) => {
          const reached = me.xp >= m.xpRequired;
          const isClaimed = claimed.has(m.key);
          return (
            <div
              key={m.key}
              className={`flex items-center gap-4 rounded-lg border p-3 ${reached ? "bg-success/10" : "bg-secondary/30 opacity-70"}`}
            >
              <div className={`xp-node ${reached ? "xp-node-on" : ""}`}>
                {m.xpRequired >= 1000 ? `${m.xpRequired / 1000}k` : m.xpRequired}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {m.label}
                  {reached && !isClaimed && <span className="dot-green-badge relative">!</span>}
                </p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
                <p className="mt-1 text-xs">
                  Reward:{" "}
                  {m.rewardStars > 0 && <span className="text-primary">{m.rewardStars} ★ </span>}
                  {m.rewardGolden > 0 && (
                    <span className="text-[var(--color-gold)]">{m.rewardGolden} ✦</span>
                  )}
                </p>
              </div>
              {reached && !isClaimed && (
                <button
                  onClick={() => onClaim(m.key)}
                  className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  Claim
                </button>
              )}
              {isClaimed && <span className="text-xs text-success">✓ Claimed</span>}
              {!reached && (
                <span className="text-xs text-muted-foreground">
                  {m.xpRequired - me.xp} XP to go
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardTab({ users, me }: { users: User[]; me: User }) {
  const sorted = users
    .filter((u) => u.on_leaderboard)
    .sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      if (b.golden_stars !== a.golden_stars) return b.golden_stars - a.golden_stars;
      if (b.xp !== a.xp) return b.xp - a.xp;
      return a.gave_up - b.gave_up;
    });
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[var(--color-gold)]" />
        <h2 className="text-xl font-bold">Leaderboard</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Player</th>
              <th className="p-2 text-center">Streak 🔥</th>
              <th className="p-2 text-right">Stars</th>
              <th className="p-2 text-right">Golden</th>
              <th className="p-2 text-right">XP</th>
              <th className="p-2 text-right">Gave Up</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u, i) => (
              <tr
                key={u.username}
                className={`border-t ${u.username === me.username ? "bg-primary/10" : ""}`}
              >
                <td className="p-2">{i + 1}</td>
                <td className="p-2 font-medium">
                  {u.username}
                  {u.gave_up >= 5 && <span className="ml-2 dot-red">!</span>}
                </td>
                <td className="p-2 text-center">
                  <span className="inline-flex items-center gap-1 font-semibold text-orange-500">
                    <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                    {u.login_streak || 1}d
                  </span>
                </td>
                <td className="p-2 text-right">{u.stars}</td>
                <td className="p-2 text-right">{u.golden_stars}</td>
                <td className="p-2 text-right">{u.xp}</td>
                <td className="p-2 text-right">{u.gave_up}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewsTab({
  posts,
  username,
  token,
}: {
  posts: NewsPost[];
  username: string;
  token: string;
}) {
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [copied, setCopied] = useState(false);

  if (selectedPost) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Navigation Bar for Full Page Read */}
        <div className="flex items-center justify-between border-b pb-4">
          <button
            onClick={() => setSelectedPost(null)}
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition-all shadow-2xs group"
          >
            <ArrowLeft className="h-4 w-4 text-primary group-hover:-translate-x-1 transition-transform" />
            <span>Înapoi la Știri</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText?.(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? "Link Copiat!" : "Distribuie"}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Full Article View */}
        <article className="rounded-3xl border bg-card p-6 sm:p-10 shadow-xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {selectedPost.pinned && (
                <span className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase text-primary border border-primary/30">
                  <Pin className="h-3.5 w-3.5" /> Pinned Announcement
                </span>
              )}
              <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border">
                📅 {new Date(selectedPost.created_at).toLocaleString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {selectedPost.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-b pb-4">
              <Megaphone className="h-4 w-4 text-primary" />
              <span>
                Postat de <strong className="text-foreground">Echipa Admin</strong>
              </span>
            </div>
          </div>

          <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap font-normal space-y-4 pt-2">
            {selectedPost.body}
          </div>

          <div className="pt-8 border-t flex items-center justify-between">
            <button
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Înapoi la toate știrile</span>
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              Full Page Article View
            </span>
          </div>
        </article>

        <NewsReviewChat newsId={selectedPost.id} username={username} token={token} />
      </div>

    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Team News</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Announcements posted by the team owner. Click any news item to view full details!
        </p>
      </div>

      {posts.length === 0 && (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No news yet. Check back soon!
        </div>
      )}

      <div className="space-y-3">
        {posts.map((p) => (
          <article
            key={p.id}
            onClick={() => setSelectedPost(p)}
            className={`rounded-2xl border bg-card p-5 cursor-pointer hover:border-primary/80 hover:shadow-md transition-all group ${
              p.pinned ? "border-primary/60 bg-primary/5" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                {p.title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {p.pinned && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary border border-primary/20">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-lg border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Eye className="h-3.5 w-3.5" /> Read Full
                </span>
              </div>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">
              {p.body}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{new Date(p.created_at).toLocaleString()}</span>
              <span className="text-primary font-medium group-hover:underline flex items-center gap-1">
                Read full page →
              </span>
            </div>
          </article>
        ))}
      </div>



    </div>
  );
}

function HowToGetStarsTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">How to get stars?</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to know about earning and spending stars in the team.
        </p>
      </div>

      {/* Prominent Lichess Studies Link Cards */}
      <section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <BookOpen className="h-5 w-5" />
          <span>Interactive Chess Study Links</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Click any study link below to open Lichess and start studying:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {STAR_GUIDE_STUDIES.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2.5 rounded-xl border bg-card p-4 text-sm font-semibold text-primary hover:bg-accent hover:border-primary/50 transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{s.label}</span>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
          ))}
        </div>
      </section>

      {STAR_GUIDE.map((s) => (
        <section key={s.title} className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold">{s.title}</h3>
          {s.intro && <p className="mt-1 text-sm text-muted-foreground">{s.intro}</p>}
          <ul className="mt-3 space-y-2">
            {s.bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm">
                <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">Owner's Lichess studies</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Fun and instructive — a like means a lot. Click any study link below to study:
        </p>
        <ul className="mt-3 space-y-2.5">
          {STAR_GUIDE_STUDIES.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{s.label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SuggestionsTab({
  suggestions,
  onRefresh,
  onSubmit,
}: {
  suggestions: Suggestion[];
  onRefresh: () => void;
  onSubmit: (data: {
    type: "bug" | "update" | "improvement";
    title: string;
    content: string;
  }) => Promise<void>;
}) {
  const [type, setType] = useState<"bug" | "update" | "improvement">("update");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    setSuccess("");
    setError("");
    try {
      await onSubmit({ type, title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      setSuccess("Your suggestion / bug report has been submitted to the Owner! Thank you!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Could not submit. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-amber-500/10 via-card to-card p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Suggestions & Bug Reports (Suggest updates)</h2>
            <p className="text-sm text-muted-foreground">
              Send bug reports, feature requests, or website improvement ideas directly to the
              Owner!
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          Submit a new suggestion or bug report
        </h3>

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Message Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("update")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  type === "update"
                    ? "border-amber-500 bg-amber-500/15 text-amber-500 shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Sparkles className="h-4 w-4" /> New Update
              </button>
              <button
                type="button"
                onClick={() => setType("bug")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  type === "bug"
                    ? "border-red-500 bg-red-500/15 text-red-500 shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Bug className="h-4 w-4" /> Bug / Issue
              </button>
              <button
                type="button"
                onClick={() => setType("improvement")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  type === "improvement"
                    ? "border-blue-500 bg-blue-500/15 text-blue-500 shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Wrench className="h-4 w-4" /> Improvement
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Rapid game mode proposal / Bug when opening daily chest..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Detailed Description
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explain what happened or what features you would like to see added or modified..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
          >
            {submitting ? "Submitting..." : "Submit to Owner 🚀"}
          </button>
        </form>
      </div>

      {/* History Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold flex items-center justify-between">
          <span>Your Submitted Suggestions ({suggestions.length})</span>
          <button onClick={onRefresh} className="text-xs text-primary hover:underline font-medium">
            Refresh
          </button>
        </h3>

        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            You haven't submitted any suggestions or bug reports yet.
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border bg-muted/30 p-4 space-y-2 transition-all hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    <h4 className="font-semibold text-sm">{s.title}</h4>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 border ${
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

                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.content}</p>

                <div className="text-[11px] text-muted-foreground/70">
                  {new Date(s.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
