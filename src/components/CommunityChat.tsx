import React, { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listChatMessages,
  sendChatMessage,
  deleteChatMessage,
  type ChatMessage,
} from "@/lib/organizer.functions";
import {
  MessageSquare,
  Send,
  Crown,
  Trash2,
  User,
  Sparkles,
  RefreshCw,
  MessageCircle,
  Image as ImageIcon,
  X,
  Eye,
} from "lucide-react";

interface CommunityChatProps {
  username?: string;
  token?: string;
  password?: string;
  isOwner?: boolean;
}

const QUICK_EMOJIS = ["👏", "🔥", "♟️", "💡", "💪", "🎉", "❤️", "🚀", "🏆"];

function compressImage(file: File, maxDim = 800, quality = 0.8): Promise<string> {
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
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CommunityChat({ username, token, password, isOwner = false }: CommunityChatProps) {
  const fetchMessages = useServerFn(listChatMessages);
  const doSendMessage = useServerFn(sendChatMessage);
  const doDeleteMessage = useServerFn(deleteChatMessage);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstLoad = useRef(true);

  async function loadChat() {
    try {
      const list = await fetchMessages();
      setMessages(list || []);
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setTimeout(scrollToBottom, 100);
      }
    } catch (e) {
      console.error("Failed to fetch chat messages:", e);
    }
  }

  useEffect(() => {
    loadChat();
    const timer = setInterval(() => {
      loadChat();
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  async function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file.");
      return;
    }
    try {
      setErrorMsg("");
      const compressed = await compressImage(file);
      setImageAttachment(compressed);
    } catch (err) {
      console.error("Image compression error:", err);
      setErrorMsg("Failed to process image file.");
    } finally {
      if (e.target) e.target.value = "";
    }
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const msg = text.trim();
    if ((!msg && !imageAttachment) || sending) return;

    setErrorMsg("");
    setSending(true);

    try {
      if (isOwner && password) {
        await doSendMessage({
          data: { password, message: msg, image_url: imageAttachment || undefined },
        });
      } else if (username && token) {
        await doSendMessage({
          data: { username, token, message: msg, image_url: imageAttachment || undefined },
        });
      } else {
        throw new Error("You are not authenticated.");
      }

      setText("");
      setImageAttachment(null);
      await loadChat();
      setTimeout(scrollToBottom, 100);
    } catch (err: unknown) {
      const msgText =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Error sending message.";
      setErrorMsg(msgText);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!password) return;
    try {
      await doDeleteMessage({ data: { password, id } });
      await loadChat();
    } catch (err: unknown) {
      console.error(err);
    }
  }

  function addEmoji(emoji: string) {
    setText((prev) => (prev ? `${prev} ${emoji}` : emoji));
  }

  return (
    <div className="mt-6 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Global Community Chat</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Share opinions, attach images, discuss ideas, and chat live with everyone
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadChat()}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          title="Refresh messages"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Messages List */}
      <div
        ref={scrollRef}
        className="max-h-[420px] min-h-[260px] overflow-y-auto space-y-3.5 pr-1 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <MessageCircle className="h-10 w-10 opacity-30 mb-2" />
            <p className="text-sm font-medium">No messages in Global Chat yet.</p>
            <p className="text-xs mt-1">
              Be the first to share your thoughts, send an image, or say hello!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = username
              ? m.username.toLowerCase() === username.toLowerCase()
              : isOwner
                ? m.is_owner
                : false;

            return (
              <div
                key={m.id}
                className={`group flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    m.is_owner
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.is_owner ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Message Box */}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                    m.is_owner
                      ? "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/25 text-foreground"
                      : isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/70 text-foreground border"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-3 text-[11px] mb-1 font-semibold ${
                      isMe && !m.is_owner
                        ? "text-primary-foreground/80"
                        : m.is_owner
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {m.username}
                      {m.is_owner && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase">
                          OWNER
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] opacity-75 font-normal">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Attached Image if any */}
                  {m.image_url && (
                    <div className="my-2 relative group/img cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-white/10 max-w-xs">
                      <img
                        src={m.image_url}
                        alt="Attached image"
                        onClick={() => setActiveLightboxImage(m.image_url!)}
                        className="max-h-56 w-full object-cover transition-transform group-hover/img:scale-105"
                      />
                      <div
                        onClick={() => setActiveLightboxImage(m.image_url!)}
                        className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1"
                      >
                        <Eye className="h-4 w-4" /> Click to view
                      </div>
                    </div>
                  )}

                  {m.message && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {m.message}
                    </p>
                  )}
                </div>

                {/* Delete button (Owner only) */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-opacity"
                    title="Delete message"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded-lg">
          {errorMsg}
        </p>
      )}

      {/* Selected Image Attachment Preview Bar */}
      {imageAttachment && (
        <div className="relative inline-flex items-center gap-3 rounded-xl border bg-secondary/50 p-2 pr-4 animate-in fade-in slide-in-from-bottom-2">
          <img
            src={imageAttachment}
            alt="Preview"
            className="h-12 w-12 rounded-lg object-cover border"
          />
          <div className="text-xs">
            <span className="font-semibold block">Attached Image</span>
            <span className="text-muted-foreground text-[10px]">Ready to send</span>
          </div>
          <button
            type="button"
            onClick={() => setImageAttachment(null)}
            className="ml-auto rounded-full bg-muted p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="Remove attachment"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Quick Emoji Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 shrink-0 mr-1">
          <Sparkles className="h-3 w-3 text-amber-500" /> Emojis:
        </span>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => addEmoji(emoji)}
            className="hover:scale-125 transition-transform rounded-md bg-muted/40 hover:bg-muted px-2 py-0.5 text-sm"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2 items-center pt-1">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageFileSelect}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${
            imageAttachment ? "border-primary text-primary bg-primary/10" : ""
          }`}
          title="Attach image file"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isOwner
              ? "Write a message as Owner..."
              : `Write a message in Global Chat, ${username || "player"}...`
          }
          maxLength={1000}
          className="flex-1 rounded-xl border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !imageAttachment) || sending}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{sending ? "Sending..." : "Send"}</span>
        </button>
      </form>
    </div>
  );
}
