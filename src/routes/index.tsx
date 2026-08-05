import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { OwnerPanel } from "@/components/OwnerPanel";
import { UserPanel } from "@/components/UserPanel";
import { MusicToggle } from "@/components/MusicToggle";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chess Team Organizer" },
      {
        name: "description",
        content:
          "Organize your chess team: track stars, golden stars, quit-counts, XP, achievements, daily chests, quizzes and a public leaderboard.",
      },
      { property: "og:title", content: "Chess Team Organizer" },
      {
        property: "og:description",
        content:
          "Organize your chess team with stars, golden stars, achievements, and a leaderboard.",
      },
    ],
  }),
  component: Index,
});

type Session =
  { role: "owner"; password: string } | { role: "user"; username: string; token: string } | null;

const KEY = "cto_session_v2";

function Index() {
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    // Clean up old-format session that lacked the token
    try {
      localStorage.removeItem("cto_session_v1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  }, [session, ready]);

  if (!ready) return null;

  if (!session) {
    return (
      <>
        <LoginScreen
          onOwnerLogin={(password) => setSession({ role: "owner", password })}
          onUserLogin={(username, token) => setSession({ role: "user", username, token })}
        />
        <MusicToggle />
      </>
    );
  }

  if (session.role === "owner") {
    return (
      <>
        <OwnerPanel password={session.password} onLogout={() => setSession(null)} />
        <MusicToggle />
      </>
    );
  }
  return (
    <>
      <UserPanel
        username={session.username}
        token={session.token}
        onLogout={() => setSession(null)}
      />
      <MusicToggle />
    </>
  );
}

