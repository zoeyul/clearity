"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Checkbox } from "@clearity/ui";
import { Sparkles, Brain, Zap, GitBranch } from "lucide-react";
import { cn } from "@clearity/ui/lib/utils";
import { createClient } from "@clearity/lib";
import { useDashboard } from "@/hooks/use-dashboard";
import { useChatHistory } from "@/hooks/use-chat-history";
import { LeftSidebar } from "@/components/dashboard/left-sidebar";

export function ReflectionDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const dashboard = useDashboard();
  const chatHistory = useChatHistory();
  const [inputValue, setInputValue] = useState("");

  // Fixed particle positions — won't change on re-render
  const particles = useMemo(() =>
    Array.from({ length: 15 }).map(() => ({
      size: 8 + Math.random() * 10,
      x: 20 + Math.random() * 55,
      y: 15 + Math.random() * 60,
      duration: 7 + Math.random() * 10,
      delay: Math.random() * -15,
    })),
  []);
  const [keywords, setKeywords] = useState<
    { text: string; size: string; x: number; y: number; opacity?: number }[]
  >([]);

  // Keyword opacity animation
  useEffect(() => {
    const interval = setInterval(() => {
      setKeywords((prev) =>
        prev.map((kw) => ({
          ...kw,
          opacity: 0.5 + Math.random() * 0.5,
        })),
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleNewSession = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("chat_sessions")
      .insert({ title: "New Chat", user_id: user.id })
      .select()
      .single();
    if (data) router.push(`/chat/${data.id}`);
  };

  const handleKeywordClick = async (keywordText: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("chat_sessions")
      .insert({ title: keywordText, user_id: user.id })
      .select()
      .single();
    if (data)
      router.push(
        `/chat/${data.id}?keyword=${encodeURIComponent(keywordText)}`,
      );
  };

  const handleSelectSession = (sessionId: string) =>
    router.push(`/chat/${sessionId}`);

  // Build dynamic thought distribution from DB keywords
  const thoughtDistribution = dashboard.topKeywords.map((kw, i) => ({
    domain: kw,
    percentage: Math.max(10, 40 - i * 8),
  }));

  // Cognitive snapshot from DB
  const cognitiveSnapshot = {
    thoughtDensity:
      dashboard.totalMessageCount > 50
        ? "High"
        : dashboard.totalMessageCount > 20
          ? "Medium"
          : "Low",
    explorationDepth: Math.min(
      5,
      Math.max(1, Math.floor(dashboard.recentSessionCount / 2)),
    ),
    primaryKeyword: dashboard.topKeywords[0] ?? "—",
  };

  if (dashboard.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#edf0f5] dark:bg-[#1a1d1d]">
        <div className="flex flex-col items-center gap-3">
          <div className="glass-solid flex h-12 w-12 items-center justify-center !rounded-2xl animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-slate-400">Loading your reflections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#edf0f5] dark:bg-[#1a1d1d]" />
      <div className="absolute -top-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-[#d4dff0]/50 blur-[120px] dark:bg-[#2a3040]/20" />
      <div className="absolute -bottom-[15%] right-[5%] h-[50%] w-[40%] rounded-full bg-[#dde3ed]/45 blur-[120px] dark:bg-[#252d38]/15" />
      <div className="absolute top-[30%] left-[40%] h-[40%] w-[35%] rounded-full bg-[#e5eaf2]/60 blur-[100px] dark:bg-[#2d3342]/15" />
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex h-full w-full gap-4 p-4 lg:gap-5 lg:p-5">
        {/* ========== LEFT: Sidebar — same as chat page ========== */}
        <div className="hidden w-[280px] shrink-0 lg:block h-full">
          <LeftSidebar
            sessions={chatHistory.sessions}
            activeSessionId={null}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewSession}
            isLoading={chatHistory.isLoading}
          />
        </div>

        {/* ========== CENTER: Thought Canvas ========== */}
        <main className="flex-1 flex flex-col gap-4">
          {/* Cognitive Snapshot */}
          <div className="glass !rounded-3xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-indigo-500" />
                <h1 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Cognitive Snapshot
                </h1>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Density
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {cognitiveSnapshot.thoughtDensity}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Depth
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    Level {cognitiveSnapshot.explorationDepth}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Focus
                  </p>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {cognitiveSnapshot.primaryKeyword}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thought Canvas */}
          <div className="flex-1 glass !rounded-3xl p-6 relative overflow-hidden">
            {/* Ambient Particles — visible when canvas is empty */}
            {dashboard.topKeywords.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Particle field */}
                {particles.map((p, i) => (
                  <svg
                    key={i}
                    className="absolute"
                    width={p.size}
                    height={p.size}
                    viewBox="0 0 24 24"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      animation: `float-particle ${p.duration}s ease-in-out infinite`,
                      animationDelay: `${p.delay}s`,
                    }}
                  >
                    <path
                      d="M12 0 C12 0 13 10 24 12 C13 14 12 24 12 24 C12 24 11 14 0 12 C11 10 12 0 12 0Z"
                      fill="rgba(100, 180, 230, 0.6)"
                    />
                  </svg>
                ))}
                {/* Central glow */}
                <div
                  className="w-48 h-48 rounded-full bg-sky-300/15 blur-[80px] animate-pulse"
                  style={{ animationDuration: "4s" }}
                />
                {/* Empty state text */}
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-zinc-400/60 tracking-wide">
                  Your thoughts will appear here
                </p>
              </div>
            )}

            {/* Floating Keywords */}
            <div className="absolute inset-0">
              {dashboard.topKeywords
                .map((kw, i) => ({
                  text: kw,
                  size: i === 0 ? "lg" : i < 3 ? "md" : "sm",
                  x: 20 + ((i * 17) % 60),
                  y: 25 + ((i * 13) % 50),
                  opacity: keywords[i]?.opacity ?? 0.8,
                }))
                .map((kw, i) => (
                  <div
                    key={i}
                    onClick={() => handleKeywordClick(kw.text)}
                    className="absolute transition-all duration-1000 cursor-pointer hover:scale-110"
                    style={{
                      left: `${kw.x}%`,
                      top: `${kw.y}%`,
                      opacity: kw.opacity ?? 0.8,
                    }}
                  >
                    <div
                      className={cn(
                        "px-4 py-2 rounded-full shadow-sm",
                        kw.size === "lg" &&
                          "bg-indigo-100 dark:bg-indigo-900/40 text-base font-medium text-indigo-700 dark:text-indigo-300",
                        kw.size === "md" &&
                          "bg-slate-100 dark:bg-slate-700/60 text-sm text-slate-600 dark:text-slate-300",
                        kw.size === "sm" &&
                          "bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {kw.text}
                    </div>
                  </div>
                ))}
            </div>

            {/* Input */}
            <div className="absolute inset-x-0 bottom-6 flex justify-center px-6">
              <div className="w-full max-w-xl">
                <div className="relative rounded-2xl bg-slate-100/90 dark:bg-slate-700/60 overflow-hidden">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputValue.trim()) {
                        handleNewSession();
                      }
                    }}
                    placeholder="What's on your mind?"
                    className="h-12 px-5 pr-12 bg-transparent border-0 text-slate-800 dark:text-white placeholder:text-slate-400 focus-visible:ring-0"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleNewSession}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  Your thoughts become interconnected patterns
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* ========== RIGHT: Analysis ========== */}
        <aside className="hidden w-[280px] shrink-0 xl:flex flex-col gap-4">
          {/* Thought Distribution */}
          <div className="glass !rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-4 rounded-full border-2 border-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Thought Distribution
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Where your mind has been this week
            </p>

            <div className="space-y-3">
              {thoughtDistribution.map((item) => (
                <div key={item.domain}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {item.domain}
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-white">
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Action Items */}
          <div className="flex-1 glass !rounded-3xl p-5 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="h-4 w-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Pending Actions
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {dashboard.pendingActions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  All caught up!
                </p>
              ) : (
                dashboard.pendingActions.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={item.is_completed}
                      onCheckedChange={(checked) =>
                        dashboard.toggleActionItem(item.id, checked as boolean)
                      }
                      className="mt-0.5 rounded-md border-slate-300 dark:border-slate-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 dark:text-slate-200">
                        {item.text}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        from &ldquo;{item.session_title}&rdquo;
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
