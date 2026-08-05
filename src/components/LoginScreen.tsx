import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ownerLogin, playerLogin } from "@/lib/organizer.functions";
import { AnimatedBackground } from "./AnimatedBackground";
import { Lock, User as UserIcon, Crown, Key } from "lucide-react";

type Props = {
  onOwnerLogin: (password: string) => void;
  onUserLogin: (username: string, token: string) => void;
};

export function LoginScreen({ onOwnerLogin, onUserLogin }: Props) {
  const doOwnerLogin = useServerFn(ownerLogin);
  const doPlayerLogin = useServerFn(playerLogin);

  const [ownerPw, setOwnerPw] = useState("");
  const [ownerErr, setOwnerErr] = useState("");
  const [ownerLoading, setOwnerLoading] = useState(false);

  const [uname, setUname] = useState("");
  const [ukey, setUkey] = useState("");
  const [uerr, setUerr] = useState("");
  const [uloading, setUloading] = useState(false);

  async function handleOwner(e: React.FormEvent) {
    e.preventDefault();
    setOwnerErr("");
    const trimmedPw = ownerPw.trim();
    if (!trimmedPw) {
      setOwnerErr("Please enter the owner password.");
      return;
    }
    setOwnerLoading(true);
    try {
      const res = await doOwnerLogin({ data: { password: trimmedPw } });
      if (res.ok) onOwnerLogin(trimmedPw);
      else setOwnerErr("Incorrect secret password.");
    } catch {
      setOwnerErr("Login failed. Try again.");
    } finally {
      setOwnerLoading(false);
    }
  }

  async function handleUser(e: React.FormEvent) {
    e.preventDefault();
    setUerr("");
    const name = uname.trim();
    const key = ukey.trim();
    if (!name) {
      setUerr("Please enter your username.");
      return;
    }
    if (!key) {
      setUerr("Player Access Key is required!");
      return;
    }
    setUloading(true);
    try {
      const u = await doPlayerLogin({ data: { username: name, key } });
      if (!u || !u.auth_token) {
        setUerr("Could not log in with that username and key.");
      } else {
        onUserLogin(u.username, u.auth_token);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Login failed. Invalid username or access key.";
      setUerr(msg);
    } finally {
      setUloading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Chess Team Organizer</h1>
          <p className="mt-2 text-muted-foreground">Sign in as owner or as a player.</p>
        </div>

        <div className="grid w-full gap-6 md:grid-cols-2">
          <form
            onSubmit={handleOwner}
            className="rounded-2xl border bg-card p-6 shadow-xl backdrop-blur-sm"
          >
            <div className="mb-4 flex items-center gap-3">
              <Crown className="h-6 w-6 text-[var(--color-gold)]" />
              <h2 className="text-xl font-semibold">Owner Sign In</h2>
            </div>
            <label className="mb-2 block text-sm text-muted-foreground">Secret Password</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                autoComplete="off"
                value={ownerPw}
                onChange={(e) => setOwnerPw(e.target.value)}
                placeholder="Enter secret password"
                className="w-full rounded-lg border bg-input py-2.5 pr-3 pl-10 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {ownerErr && <p className="mt-2 text-sm text-destructive">{ownerErr}</p>}
            <button
              type="submit"
              disabled={ownerLoading}
              className="mt-4 w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {ownerLoading ? "Signing in…" : "Sign in as Owner"}
            </button>
          </form>

          <form
            onSubmit={handleUser}
            className="rounded-2xl border bg-card p-6 shadow-xl backdrop-blur-sm"
          >
            <div className="mb-4 flex items-center gap-3">
              <UserIcon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Player Sign In</h2>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={uname}
                  onChange={(e) => setUname(e.target.value)}
                  placeholder="Enter your username (e.g. swr34)"
                  className="w-full rounded-lg border bg-input py-2.5 pr-3 pl-10 outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Player Access Key{" "}
                <span className="text-xs font-semibold text-destructive">* Required</span>
              </label>
              <div className="relative">
                <Key className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={ukey}
                  onChange={(e) => setUkey(e.target.value)}
                  placeholder="Enter access key provided by owner"
                  className="w-full font-mono text-sm rounded-lg border bg-input py-2.5 pr-3 pl-10 outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            {uerr && <p className="mt-2 text-sm text-destructive">{uerr}</p>}
            <p className="mt-2 text-xs text-muted-foreground">
              Enter your username and access key to view your stats, achievements, and shop!
            </p>
            <button
              type="submit"
              disabled={uloading}
              className="mt-4 w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {uloading ? "Signing in…" : "Sign in as Player"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
