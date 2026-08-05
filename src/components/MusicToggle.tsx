import { useEffect, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import { isMusicPlaying, musicPreference, onMusicChange, startMusic, toggleMusic } from "@/lib/music";

export function MusicToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const unsub = onMusicChange(setOn);
    setOn(isMusicPlaying());

    if (!musicPreference()) return unsub;

    // Browsers block audio until the first user gesture: try now, retry on first interaction.
    void startMusic();
    const kick = () => {
      if (!isMusicPlaying() && musicPreference()) void startMusic();
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      unsub();
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggleMusic}
      title={on ? "Turn action music off" : "Turn action music on"}
      aria-label={on ? "Turn action music off" : "Turn action music on"}
      className={`fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-xl backdrop-blur transition-all hover:scale-110 active:scale-95 ${
        on
          ? "border-primary/50 bg-primary/20 text-primary"
          : "border-border bg-card/90 text-muted-foreground"
      }`}
    >
      {on ? <Music className="h-5 w-5 animate-pulse" /> : <VolumeX className="h-5 w-5" />}
    </button>
  );
}
