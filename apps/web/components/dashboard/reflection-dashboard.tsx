"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Checkbox } from "@clearity/ui";
import { Zap, GitBranch } from "lucide-react";
import { LoadingScreen } from "@/components/loading-screen";
import { cn } from "@clearity/ui/lib/utils";
import { createClient } from "@clearity/lib";
import { useDashboard } from "@/hooks/use-dashboard";
import { useChatHistory } from "@/hooks/use-chat-history";
import { LeftSidebar } from "@/components/dashboard/left-sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";

export function ReflectionDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const dashboard = useDashboard();
  const chatHistory = useChatHistory();
  const [inputValue, setInputValue] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [expandedMain, setExpandedMain] = useState<string | null>(null);
  const [canvasKeywords, setCanvasKeywords] = useState<
    {
      id: string;
      text: string;
      hierarchy: "main" | "sub";
      parentId?: string;
      hitCount?: number;
      createdAt?: string;
    }[]
  >([]);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [glowingIds, setGlowingIds] = useState<Set<string>>(new Set());
  const [similarities, setSimilarities] = useState<
    { sourceId: string; targetId: string; score: number }[]
  >([]);

  const mainKeywords = useMemo(
    () => canvasKeywords.filter((k) => k.hierarchy === "main"),
    [canvasKeywords],
  );

  // d3-force simulation for node positioning
  interface ForceNode extends SimulationNodeDatum {
    id: string;
    text: string;
    hitCount: number;
  }

  const [nodePositions, setNodePositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const simulationRef = useRef<ReturnType<
    typeof forceSimulation<ForceNode>
  > | null>(null);

  // Stable key: only re-run simulation when keyword IDs or relations actually change
  const maxHitCount = Math.max(1, ...mainKeywords.map((k) => k.hitCount ?? 1));
  const mainKeywordIds = mainKeywords.map((k) => k.id).join(",");
  const similarityKey = similarities
    .map((r) => `${r.sourceId}-${r.targetId}`)
    .join(",");

  useEffect(() => {
    if (mainKeywords.length === 0) {
      setNodePositions(new Map());
      return;
    }

    const nodes: ForceNode[] = mainKeywords.map((kw, i) => ({
      id: kw.id,
      text: kw.text,
      hitCount: kw.hitCount ?? 1,
      x: 250,
      y: 200,
    }));

    const links: SimulationLinkDatum<ForceNode>[] = similarities
      .filter(
        (r) =>
          nodes.some((n) => n.id === r.sourceId) &&
          nodes.some((n) => n.id === r.targetId),
      )
      .map((r) => ({
        source: r.sourceId,
        target: r.targetId,
        strength: r.score * 1.5,
        distance: Math.max(40, 180 * (1 - r.score)),
      }));

    if (simulationRef.current) simulationRef.current.stop();

    const timerId = setTimeout(() => {
      const sim = forceSimulation(nodes)
        .alpha(0.4)
        .force(
          "link",
          forceLink<ForceNode, SimulationLinkDatum<ForceNode>>(links)
            .id((d) => d.id)
            .distance(
              (d: SimulationLinkDatum<ForceNode> & { distance?: number }) =>
                d.distance ?? 120,
            )
            .strength(
              (d: SimulationLinkDatum<ForceNode> & { strength?: number }) =>
                d.strength ?? 0.5,
            ),
        )
        .force("charge", forceManyBody().strength(-10))
        .force(
          "x",
          forceX<ForceNode>(250).strength((d) => {
            const hc = d.hitCount;
            // hit_count 최우선, 같으면 최신(index 큰 쪽)이 중앙
            const isNewest = d.id === mainKeywords[mainKeywords.length - 1].id;
            if (hc === maxHitCount && isNewest) return 0.5;
            return 0.05 + (hc / maxHitCount) * 0.4;
          }),
        )
        .force(
          "y",
          forceY<ForceNode>(200).strength((d) => {
            const hc = d.hitCount;
            const isNewest = d.id === mainKeywords[mainKeywords.length - 1].id;
            if (hc === maxHitCount && isNewest) return 0.5;
            return 0.05 + (hc / maxHitCount) * 0.4;
          }),
        )
        .force("collide", forceCollide(35).strength(0.3))
        .on("tick", () => {
          const positions = new Map<string, { x: number; y: number }>();
          nodes.forEach((n) => {
            positions.set(n.id, {
              x: Math.max(40, Math.min(460, n.x ?? 250)),
              y: Math.max(40, Math.min(360, n.y ?? 200)),
            });
          });
          setNodePositions(new Map(positions));
        });

      simulationRef.current = sim;
    }, 100);

    return () => {
      clearTimeout(timerId);
      simulationRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainKeywordIds, similarityKey]);

  // Fixed particle positions
  const particles = useMemo(
    () =>
      Array.from({ length: 15 }).map(() => ({
        size: 8 + Math.random() * 10,
        x: 20 + Math.random() * 55,
        y: 15 + Math.random() * 60,
        duration: 7 + Math.random() * 10,
        delay: Math.random() * -15,
      })),
    [],
  );

  // Check for API key — also listen for changes
  useEffect(() => {
    const check = () => {
      const key = localStorage.getItem("clearity-api-key");
      setHasApiKey(!!key);
    };
    check();
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  // Load existing fragment keywords from DB
  const loadKeywords = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // This week: Monday 00:00 ~ Sunday 23:59
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("session_keywords")
      .select("id, label, hierarchy, status, parent_id, hit_count, created_at")
      .eq("user_id", user.id)
      .in("status", ["fragment", "clustered", "core"])
      .gte("created_at", monday.toISOString());

    if (data && data.length > 0) {
      setCanvasKeywords(
        data.map((kw) => ({
          id: kw.id,
          text: kw.label,
          hierarchy: (kw.hierarchy ?? "sub") as "main" | "sub",
          parentId: kw.parent_id ?? undefined,
          hitCount: kw.hit_count ?? 1,
          createdAt: kw.created_at,
        })),
      );

      // Load relations from DB
      const { data: rels } = await supabase
        .from("keyword_relations")
        .select("source_id, target_id, score")
        .eq("user_id", user.id);

      if (rels) {
        setSimilarities(
          rels.map((r) => ({
            sourceId: r.source_id,
            targetId: r.target_id,
            score: r.score,
          })),
        );
      }
    }
  };

  useEffect(() => {
    loadKeywords();
  }, [supabase]);

  // Extract keywords from input via Gemini
  const handleExtract = async () => {
    if (!inputValue.trim() || isExtracting) return;

    const apiKey =
      typeof window !== "undefined"
        ? localStorage.getItem("clearity-api-key")
        : null;
    if (!apiKey) {
      router.push("/settings");
      return;
    }

    setIsExtracting(true);
    const text = inputValue;
    setInputValue("");

    // Reset textarea height
    const textarea = document.querySelector("textarea");
    if (textarea) textarea.style.height = "auto";

    try {
      const res = await fetch("/api/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, apiKey }),
      });

      if (res.status === 429) {
        setErrorMessage("API rate limit reached. Please wait a moment and try again.");
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      if (res.ok) {
        const data = await res.json();

        if (data.action === "merged") {
          // Update hit_count + add new subs
          const newSubs = (data.subs ?? []).map(
            (sub: { id: string; label: string }) => ({
              id: sub.id,
              text: sub.label,
              hierarchy: "sub" as const,
              parentId: data.mergedInto,
            }),
          );
          setCanvasKeywords((prev) => [
            ...prev.map((kw) =>
              kw.id === data.mergedInto
                ? { ...kw, hitCount: (kw.hitCount ?? 1) + 1 }
                : kw,
            ),
            ...newSubs,
          ]);
          setGlowingIds(new Set([data.mergedInto]));
          setTimeout(() => setGlowingIds(new Set()), 5000);
        } else if (data.action === "created") {
          const newKeywords: typeof canvasKeywords = [
            {
              id: data.mainId,
              text: data.main,
              hierarchy: "main",
              hitCount: 1,
            },
          ];

          if (data.subs?.length) {
            newKeywords.push(
              ...data.subs.map((sub: { id: string; label: string }) => ({
                id: sub.id,
                text: sub.label,
                hierarchy: "sub" as const,
                parentId: data.mainId,
              })),
            );
          }

          setCanvasKeywords((prev) => [...prev, ...newKeywords]);
          // Glow new main keyword for 5 seconds
          setGlowingIds(new Set([data.mainId]));
          setTimeout(() => setGlowingIds(new Set()), 5000);
          // Relations are already in DB, reload to get them
          loadKeywords();
        }
      }
    } catch {
      // Silent fail
    } finally {
      setIsExtracting(false);
    }
  };

  const handleKeywordClick = async (keywordText: string) => {
    setIsNavigating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setIsNavigating(false);
      return;
    }

    const id = crypto.randomUUID();
    const { error } = await supabase
      .from("chat_sessions")
      .insert({ id, title: keywordText, user_id: user.id });

    if (error) {
      console.error("[handleKeywordClick] insert failed:", error);
      setIsNavigating(false);
      return;
    }

    chatHistory.refetch();
    router.push(
      `/chat/${id}?keyword=${encodeURIComponent(keywordText)}`,
    );
  };

  const handleSelectSession = (sessionId: string) =>
    router.push(`/chat/${sessionId}`);

  // Build dynamic thought distribution from DB keywords
  const thoughtDistribution = dashboard.topKeywords.map((kw, i) => ({
    domain: kw,
    percentage: Math.max(10, 40 - i * 8),
  }));

  // Check for active session
  const activeSession = chatHistory.sessions.find(
    (s) => s.status === "active" && s.title && s.title !== "New Chat"
  );
  const hasActiveSession = !!activeSession;

  if (dashboard.isLoading || isNavigating) {
    return <LoadingScreen />;
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
            onNewChat={() => {}}
            isLoading={chatHistory.isLoading}
          />
        </div>

        {/* ========== CENTER: Thought Canvas ========== */}
        <main className="flex-1 flex flex-col gap-4">
          {/* Header */}
          <div className="glass !rounded-3xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MobileSidebar />
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                    {dashboard.userName ? `Hi, ${dashboard.userName}.` : "Hi."}
                  </h1>
                  <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    Clear your mind, find your clarity
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Focus
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {hasActiveSession ? activeSession.title : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Thought Canvas */}
          <div
            className="flex-1 glass !rounded-3xl p-6 relative overflow-hidden"
            style={{ perspective: "600px", perspectiveOrigin: "50% 45%" }}
          >
            {/* Central glow — always visible */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
              <div
                className="w-48 h-48 rounded-full bg-sky-300/15 blur-[80px] animate-pulse"
                style={{ animationDuration: "4s" }}
              />
            </div>

            {/* Ambient Particles — visible when canvas is empty or extracting */}
            {(canvasKeywords.length === 0 || isExtracting) && (
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
                {/* Empty state text — only when no keywords */}
                {canvasKeywords.length === 0 && (
                  <p
                    className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs tracking-wide transition-all",
                      isExtracting
                        ? "text-zinc-500 animate-bounce"
                        : "text-zinc-400/60",
                    )}
                  >
                    {isExtracting
                      ? "Extracting your thoughts..."
                      : "Your thoughts will appear here"}
                  </p>
                )}
              </div>
            )}

            {/* Legend */}
            {similarities.length > 0 && !expandedMain && (
              <p className="absolute top-4 right-4 text-[10px] text-slate-400 z-20">
                Thicker lines = stronger connection
              </p>
            )}

            {/* Relation Lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
              style={{
                opacity: expandedMain ? 0.15 : 1,
                filter: expandedMain ? "blur(3px)" : "none",
                transition: "opacity 0.4s, filter 0.4s",
              }}
            >
              {similarities
                .filter((s) => Math.round(s.score * 100) / 100 >= 0.65)
                .map((sim, i) => {
                  const sourcePos = nodePositions.get(sim.sourceId);
                  const targetPos = nodePositions.get(sim.targetId);
                  if (!sourcePos || !targetPos) return null;

                  const sx = (sourcePos.x / 500) * 100;
                  const sy = (sourcePos.y / 400) * 100;
                  const tx = (targetPos.x / 500) * 100;
                  const ty = (targetPos.y / 400) * 100;

                  return (
                    <line
                      key={`sim-${i}`}
                      x1={`${sx}%`}
                      y1={`${sy}%`}
                      x2={`${tx}%`}
                      y2={`${ty}%`}
                      stroke={`rgba(148, 163, 184, ${Math.max(0.2, (sim.score - 0.65) / 0.35)})`}
                      strokeWidth={1 + (sim.score - 0.65) * 15}
                      strokeLinecap="round"
                    />
                  );
                })}
            </svg>

            {/* Keyword Constellation */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Main keywords — pill stays in place, note slides out */}
              {mainKeywords.map((kw, i) => {
                const isGlowing = glowingIds.has(kw.id);
                const pos = nodePositions.get(kw.id);
                if (!pos) return null;
                const x = (pos.x / 500) * 100;
                const y = (pos.y / 400) * 100;
                const isExpanded = expandedMain === kw.text;
                const isFaded = expandedMain !== null && !isExpanded;
                const subs = canvasKeywords.filter(
                  (k) => k.hierarchy === "sub" && k.parentId === kw.id,
                );
                const noteOnRight = x <= 50;

                return (
                  <div
                    key={kw.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      translate: "-50% -50%",
                      opacity: isFaded ? 0.15 : 1,
                      filter: isFaded ? "blur(3px)" : "none",
                      transition: "opacity 0.4s, filter 0.4s",
                      animation: `keyword-bounce ${3 + i * 0.4}s ease-in-out infinite`,
                      animationDelay: `${i * 0.6}s`,
                    }}
                  >
                    <div
                      className="font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:scale-105 transition-all whitespace-nowrap"
                      style={{ fontSize: isGlowing ? "15px" : "14px", animation: isGlowing ? "pulse-glow 3s ease-in-out infinite" : undefined }}
                      onClick={() =>
                        setExpandedMain(isExpanded ? null : kw.text)
                      }
                    >
                      {kw.text}
                    </div>

                    {/* Note — positioned relative to keyword via left/right: 100% */}
                    {isExpanded && (
                      <div
                        className="absolute flex items-center pointer-events-none"
                        style={{
                          top: "50%",
                          transform: "translateY(-50%)",
                          ...(noteOnRight
                            ? { left: "100%", paddingLeft: "8px" }
                            : {
                                right: "100%",
                                paddingRight: "8px",
                                flexDirection: "row-reverse" as const,
                              }),
                          zIndex: 25,
                        }}
                      >
                        {/* Dashed connector */}
                        <div
                          className="shrink-0"
                          style={{
                            width: 0,
                            height: "1px",
                            borderTop: "1.5px dashed rgba(150, 160, 180, 0.5)",
                            animation: "lineGrow 0.4s 0.1s forwards",
                          }}
                        />
                        {/* Note card */}
                        <div
                          className={`glass-subtle !rounded-2xl px-5 py-4 w-[180px] shrink-0 pointer-events-auto ${noteOnRight ? "ml-1" : "mr-1"}`}
                          style={{
                            opacity: 0,
                            animation: "fadeIn 0.3s 0.3s ease-out forwards",
                          }}
                        >
                          <div className="flex flex-col gap-1.5 mb-3">
                            {subs.map((sub, si) => (
                              <span
                                key={sub.id}
                                className="text-[11px] text-slate-700 dark:text-slate-400"
                                style={{
                                  opacity: 0,
                                  animation: `fadeIn 0.3s ${0.5 + si * 0.1}s forwards`,
                                }}
                              >
                                #{sub.text}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKeywordClick(kw.text);
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              style={{
                                opacity: 0,
                                animation: `fadeIn 0.3s ${0.5 + subs.length * 0.1 + 0.1}s forwards`,
                              }}
                            >
                              Deep Dive →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="absolute inset-x-0 bottom-6 flex justify-center px-6">
              <div className="w-full max-w-xl">
                {/* Extracting status — above input when keywords exist */}
                {isExtracting && canvasKeywords.length > 0 && (
                  <p className="text-center text-[11px] text-zinc-500 mb-2 animate-pulse">
                    Extracting your thoughts...
                  </p>
                )}
                <div className="relative rounded-2xl bg-slate-100/90 dark:bg-slate-700/60 overflow-hidden">
                  <textarea
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      // Auto-resize
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 160) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing &&
                        inputValue.trim()
                      ) {
                        e.preventDefault();
                        handleExtract();
                      }
                    }}
                    placeholder="What's on your mind?"
                    disabled={isExtracting}
                    rows={1}
                    className="block w-full max-h-[160px] px-5 py-3 pr-12 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none overflow-y-auto"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleExtract}
                    disabled={isExtracting || !inputValue.trim()}
                    className="absolute right-2 bottom-2 h-8 w-8 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap
                      className="h-4 w-4"
                      fill={inputValue.trim() ? "currentColor" : "none"}
                    />
                  </Button>
                </div>
                {errorMessage ? (
                  <p className="text-center text-[11px] text-red-500 mt-2">
                    {errorMessage}
                  </p>
                ) : !hasApiKey ? (
                  <p className="text-center text-[11px] text-amber-500 mt-2">
                    API key required — go to Settings to add your Gemini key
                  </p>
                ) : (
                  <p className="text-center text-[11px] text-slate-400 mt-2">
                    Your thoughts become interconnected patterns
                  </p>
                )}
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
