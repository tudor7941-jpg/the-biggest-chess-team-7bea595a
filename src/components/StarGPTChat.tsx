import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askStarGPT } from "@/lib/organizer.functions";
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  User,
  HelpCircle,
  Zap,
  Image as ImageIcon,
  X,
  Eye,
} from "lucide-react";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  image?: string; // dataUrl
  time: string;
};

const SUGGESTIONS = [
  "How do I earn more Stars and Golden Stars? ⭐",
  "What is the best opening move in chess?",
  "How does the Sugest updates tab work?",
  "Tell me about the Daily Quiz & Marathon!",
];

function compressImageForStarGPT(
  file: File,
  maxDim = 1000,
  quality = 0.8,
): Promise<{ dataUrl: string; mimeType: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas error");
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = dataUrl.split(",")[1] || "";
        resolve({ dataUrl, mimeType, base64 });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function StarGPTChat({ username, token }: { username: string; token: string }) {
  const queryFn = useServerFn(askStarGPT);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<{
    dataUrl: string;
    mimeType: string;
    base64: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageKey = `stargpt_chat_${username}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`stargpt_chat_${username}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    return [
      {
        id: "welcome-1",
        sender: "bot",
        text: `Hello **${username}**! 👋 I'm **StarGPT**. Ask me any question or upload an image — whether about our chess platform or any other topic — and I will give you a direct, concrete answer!`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save StarGPT chat history:", e);
    }
  }, [messages, storageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleClear = () => {
    const initial: Message[] = [
      {
        id: "welcome-1",
        sender: "bot",
        text: `Hello **${username}**! 👋 I'm **StarGPT**. Ask me any question or upload an image — whether about our chess platform or any other topic — and I will give you a direct, concrete answer!`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setMessages(initial);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  };

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imgData = await compressImageForStarGPT(file);
      setSelectedImage(imgData);
    } catch (err) {
      console.error("Failed to process image for StarGPT:", err);
    } finally {
      if (e.target) e.target.value = "";
    }
  }

  async function handleSend(textToSend?: string) {
    const prompt = (textToSend || input).trim();
    if ((!prompt && !selectedImage) || loading) return;

    const currentImage = selectedImage;
    setSelectedImage(null);

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: prompt || "Attached an image for analysis",
      image: currentImage?.dataUrl,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        text: m.text,
      }));

      const res = await queryFn({
        data: {
          prompt: prompt || "Please analyze this image and answer based on it.",
          image: currentImage
            ? {
                mimeType: currentImage.mimeType,
                data: currentImage.base64,
              }
            : undefined,
          history,
        },
      });

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Could not connect to StarGPT.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "bot",
          text: `⚠️ Error: ${msg}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[660px] rounded-2xl border bg-card shadow-xl overflow-hidden">
      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute -top-12 right-0 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={activeLightboxImage}
              alt="Enlarged chat attachment"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary/10 via-card to-amber-500/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-amber-500 text-primary-foreground shadow-md">
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                StarGPT AI Assistant
              </h2>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Multimodal AI
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ask questions or upload chess images for instant intelligent analysis
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          title="Reset chat history"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => {
          const isBot = m.sender === "bot";
          return (
            <div key={m.id} className={`flex items-start gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isBot
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-muted-foreground border"
                }`}
              >
                {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                  isBot
                    ? "bg-card border text-card-foreground rounded-tl-xs"
                    : "bg-primary text-primary-foreground rounded-tr-xs"
                }`}
              >
                {/* Image in message if present */}
                {m.image && (
                  <div className="mb-2 relative group/img cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-white/10 max-w-xs">
                    <img
                      src={m.image}
                      alt="User uploaded attachment"
                      onClick={() => setActiveLightboxImage(m.image!)}
                      className="max-h-56 w-full object-cover transition-transform group-hover/img:scale-105"
                    />
                    <div
                      onClick={() => setActiveLightboxImage(m.image!)}
                      className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1"
                    >
                      <Eye className="h-4 w-4" /> View full image
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                <div
                  className={`mt-1.5 text-[10px] ${
                    isBot ? "text-muted-foreground" : "text-primary-foreground/70"
                  } text-right`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-xs border bg-card px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
              <span>StarGPT is processing your prompt & image...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length < 5 && (
        <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground shrink-0 font-medium">Try asking:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={loading}
              className="shrink-0 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Attached Image Preview above footer */}
      {selectedImage && (
        <div className="px-4 py-2 border-t bg-secondary/40 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <img
              src={selectedImage.dataUrl}
              alt="Selected"
              className="h-10 w-10 rounded-lg object-cover border"
            />
            <div className="text-xs">
              <span className="font-semibold block">Image attached</span>
              <span className="text-muted-foreground text-[10px]">
                StarGPT will analyze this image
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="rounded-full bg-muted p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t bg-card p-3 sm:p-4"
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${
            selectedImage ? "border-amber-500 text-amber-500 bg-amber-500/10" : ""
          }`}
          title="Upload an image for StarGPT to inspect"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedImage
                ? "Ask StarGPT about this image..."
                : "Ask StarGPT anything or upload an image..."
            }
            maxLength={1000}
            disabled={loading}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 pr-10"
          />
          <Zap className="absolute right-3 top-3 h-4 w-4 text-amber-500 opacity-60" />
        </div>

        <button
          type="submit"
          disabled={(!input.trim() && !selectedImage) || loading}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-amber-500 px-5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shrink-0 shadow-sm"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{loading ? "Thinking..." : "Ask"}</span>
        </button>
      </form>
    </div>
  );
}
