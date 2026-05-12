import { useEffect, useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  PenLine,
  Video,
  Scissors,
  Send,
  Megaphone,
  Plus,
  Instagram,
  Play,
  Heart,
  MessageCircle,
  Trash2,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { cn } from "../lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────── */

type Stage = "script" | "shoot" | "edit" | "post" | "ads";

interface ContentItem {
  id: string;
  title: string;
  hook: string;
  script: string;
  stage: Stage;
  createdAt: string;
  shootDate?: string;
  editor?: string;
  caption?: string;
  hashtags?: string;
  postUrl?: string;
  postedAt?: string;
  thumbnailUrl?: string;
  likes?: number;
  comments?: number;
  views?: number;
  adBudget?: number;
  adStatus?: "off" | "live" | "paused";
}

const STAGES: { id: Stage; label: string; icon: typeof PenLine; color: string; tip: string }[] = [
  {
    id: "script",
    label: "1. Script",
    icon: PenLine,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    tip: "Write what you're gonna say. Hook + body + call-to-action.",
  },
  {
    id: "shoot",
    label: "2. Shoot",
    icon: Video,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    tip: "Film the video. Add a shoot date so you don't forget.",
  },
  {
    id: "edit",
    label: "3. Edit",
    icon: Scissors,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    tip: "Cut it together. Add captions, music, B-roll.",
  },
  {
    id: "post",
    label: "4. Post",
    icon: Send,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    tip: "Drop it on Instagram. Paste the caption + hashtags.",
  },
  {
    id: "ads",
    label: "5. Ads",
    icon: Megaphone,
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
    tip: "Boost the winners. Spend money on what's already working.",
  },
];

const STORAGE_KEY = "ddm:content-flywheel:v1";

/* ──────────────────────────────────────────────────────────────────────────
 * Seed data — Digital Media Dash example pieces so the board isn't empty
 * ────────────────────────────────────────────────────────────────────────── */

function seedItems(): ContentItem[] {
  const now = Date.now();
  return [
    {
      id: "c1",
      title: "Why most agencies fail in year 1",
      hook: "POV: you started an agency and it's broke",
      script:
        "Hook: POV — you started an agency and it's broke.\nBody: 3 reasons it dies — no offer, no system, no follow-up.\nCTA: Save this if you're starting one.",
      stage: "script",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: "c2",
      title: "Day in the life: media buyer",
      hook: "I run $50k/day in ads. Here's my morning.",
      script: "Hook + 4 quick cuts + CTA: Comment 'ads' for the doc.",
      stage: "shoot",
      shootDate: new Date(now + 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: "c3",
      title: "3 hooks that print money",
      hook: "If your hook sucks nothing else matters",
      script: "Show 3 hook templates with examples.",
      stage: "edit",
      editor: "Jay",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
      id: "c4",
      title: "Client closed $12k off one Reel",
      hook: "This one Reel closed $12k.",
      script: "Story + receipts + CTA.",
      stage: "post",
      caption:
        "This one Reel closed a $12k deal. Here's exactly what it said 👇\n\nSave this for later.",
      hashtags: "#agency #contentmarketing #smma #digitalmediadash",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    },
    {
      id: "c5",
      title: "Stop posting. Start systemizing.",
      hook: "Stop posting. Start systemizing.",
      script: "Walk through the flywheel: script → shoot → edit → post → ads.",
      stage: "ads",
      caption: "The content flywheel that built DDM. Save this.",
      hashtags: "#contentstrategy #agencyowner",
      postUrl: "https://instagram.com/p/example",
      postedAt: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
      likes: 2430,
      comments: 187,
      views: 48200,
      adBudget: 50,
      adStatus: "live",
    },
  ];
}

/* ──────────────────────────────────────────────────────────────────────────
 * Local storage hook
 * ────────────────────────────────────────────────────────────────────────── */

function useFlywheelItems() {
  const [items, setItems] = useState<ContentItem[]>(() => {
    if (typeof window === "undefined") return seedItems();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedItems();
      const parsed = JSON.parse(raw) as ContentItem[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedItems();
    } catch {
      return seedItems();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const updateItem = useCallback((id: string, patch: Partial<ContentItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const addItem = useCallback((item: ContentItem) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const resetItems = useCallback(() => {
    setItems(seedItems());
  }, []);

  return { items, updateItem, addItem, removeItem, resetItems };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Page
 * ────────────────────────────────────────────────────────────────────────── */

export function ContentFlywheel() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { items, updateItem, addItem, removeItem, resetItems } = useFlywheelItems();
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: "Content Flywheel" }]);
  }, [setBreadcrumbs]);

  const counts = useMemo(() => {
    const c: Record<Stage, number> = { script: 0, shoot: 0, edit: 0, post: 0, ads: 0 };
    for (const it of items) c[it.stage]++;
    return c;
  }, [items]);

  const postedItems = useMemo(
    () => items.filter((it) => it.stage === "post" || it.stage === "ads"),
    [items],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Content Flywheel</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Every video from idea to ads — one board, five stages, drag to move.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetItems}>
              Reset demo
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New idea
            </Button>
          </div>
        </div>

        {/* Stage summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
          {STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2",
                  s.color,
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-wide truncate">
                    {s.label}
                  </div>
                  <div className="text-lg font-semibold tabular-nums leading-tight">
                    {counts[s.id]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="flywheel" className="flex-1 min-h-0 flex flex-col">
        <div className="px-6 pt-3 shrink-0">
          <TabsList variant="line">
            <TabsTrigger value="flywheel">
              <Sparkles className="h-4 w-4" /> Flywheel
            </TabsTrigger>
            <TabsTrigger value="instagram">
              <Instagram className="h-4 w-4" /> Instagram
            </TabsTrigger>
            <TabsTrigger value="how">
              <HelpCircle className="h-4 w-4" /> How it works
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="flywheel" className="flex-1 min-h-0 overflow-hidden">
          <FlywheelBoard
            items={items}
            onMove={(id, stage) => updateItem(id, { stage })}
            onOpen={(item) => setEditing(item)}
          />
        </TabsContent>

        <TabsContent value="instagram" className="flex-1 min-h-0 overflow-auto">
          <InstagramTab items={postedItems} onOpen={(item) => setEditing(item)} />
        </TabsContent>

        <TabsContent value="how" className="flex-1 min-h-0 overflow-auto">
          <HowItWorks />
        </TabsContent>
      </Tabs>

      {editing && (
        <ItemDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateItem(editing.id, patch);
            setEditing(null);
          }}
          onDelete={() => {
            removeItem(editing.id);
            setEditing(null);
          }}
        />
      )}

      {creating && (
        <NewIdeaDialog
          onClose={() => setCreating(false)}
          onCreate={(item) => {
            addItem(item);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Kanban-style flywheel board
 * ────────────────────────────────────────────────────────────────────────── */

function FlywheelBoard({
  items,
  onMove,
  onOpen,
}: {
  items: ContentItem[];
  onMove: (id: string, stage: Stage) => void;
  onOpen: (item: ContentItem) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const grouped = useMemo(() => {
    const g: Record<Stage, ContentItem[]> = {
      script: [],
      shoot: [],
      edit: [],
      post: [],
      ads: [],
    };
    for (const it of items) g[it.stage].push(it);
    return g;
  }, [items]);

  const activeItem = activeId ? items.find((i) => i.id === activeId) ?? null : null;

  function handleStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const item = items.find((i) => i.id === active.id);
    if (!item) return;

    const stageIds = STAGES.map((s) => s.id);
    let targetStage: Stage | null = null;
    if (stageIds.includes(over.id as Stage)) {
      targetStage = over.id as Stage;
    } else {
      const overItem = items.find((i) => i.id === over.id);
      if (overItem) targetStage = overItem.stage;
    }
    if (targetStage && targetStage !== item.stage) {
      onMove(item.id, targetStage);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd}>
      <div className="h-full overflow-x-auto overflow-y-hidden px-6 py-4">
        <div className="flex gap-3 h-full">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              items={grouped[stage.id]}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeItem ? <ItemCard item={activeItem} onOpen={() => {}} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function StageColumn({
  stage,
  items,
  onOpen,
}: {
  stage: (typeof STAGES)[number];
  items: ContentItem[];
  onOpen: (item: ContentItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const Icon = stage.icon;

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0 h-full">
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md border mb-2", stage.color)}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-semibold">{stage.label}</span>
        <span className="ml-auto text-xs tabular-nums opacity-70">{items.length}</span>
      </div>
      <p className="text-xs text-muted-foreground px-1 mb-2 leading-snug">{stage.tip}</p>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[100px] rounded-md p-1.5 space-y-1.5 overflow-y-auto transition-colors border border-dashed",
          isOver ? "bg-accent/40 border-primary/40" : "bg-muted/20 border-transparent",
        )}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 ? (
            <div className="text-xs text-muted-foreground/60 text-center py-6">
              Drop here
            </div>
          ) : (
            items.map((item) => <ItemCard key={item.id} item={item} onOpen={onOpen} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  onOpen,
  isOverlay,
}: {
  item: ContentItem;
  onOpen: (item: ContentItem) => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { item },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) {
          e.preventDefault();
          return;
        }
        onOpen(item);
      }}
      className={cn(
        "rounded-md border bg-card p-2.5 cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && !isOverlay ? "opacity-30" : "",
        isOverlay ? "shadow-lg ring-1 ring-primary/20" : "hover:shadow-sm hover:border-primary/40",
      )}
    >
      <div className="text-sm font-medium leading-snug line-clamp-2 mb-1">{item.title}</div>
      {item.hook && (
        <div className="text-xs text-muted-foreground line-clamp-2 italic mb-2">
          “{item.hook}”
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {item.shootDate && item.stage === "shoot" && (
          <Badge variant="outline" className="text-[10px]">
            <Calendar className="h-3 w-3" /> {item.shootDate}
          </Badge>
        )}
        {item.editor && item.stage === "edit" && (
          <Badge variant="outline" className="text-[10px]">
            ✂ {item.editor}
          </Badge>
        )}
        {item.stage === "post" && item.caption && (
          <Badge variant="outline" className="text-[10px]">
            <CheckCircle2 className="h-3 w-3" /> caption ready
          </Badge>
        )}
        {item.stage === "ads" && (
          <Badge
            variant={item.adStatus === "live" ? "default" : "outline"}
            className="text-[10px]"
          >
            <Megaphone className="h-3 w-3" /> ${item.adBudget ?? 0}/day
          </Badge>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Instagram tab — completed/posted videos
 * ────────────────────────────────────────────────────────────────────────── */

function InstagramTab({
  items,
  onOpen,
}: {
  items: ContentItem[];
  onOpen: (item: ContentItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <Instagram className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-base font-semibold">No posts yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          When you move a piece into <b>Post</b>, it'll show up here so you can grab the caption
          and drop it on Instagram.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="text-sm text-muted-foreground">
        Everything you've finished editing or posted. Click any card to open the caption + link.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <InstagramCard key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function InstagramCard({
  item,
  onOpen,
}: {
  item: ContentItem;
  onOpen: (item: ContentItem) => void;
}) {
  const posted = !!item.postedAt;
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="text-left rounded-lg border bg-card overflow-hidden hover:shadow-md hover:border-primary/40 transition-all"
    >
      <div className="relative aspect-[9/16] bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-orange-500/30 flex items-center justify-center">
        <Play className="h-10 w-10 text-white/90 drop-shadow" />
        <div className="absolute top-2 left-2">
          {posted ? (
            <Badge className="bg-emerald-500 text-white border-0">Posted</Badge>
          ) : (
            <Badge variant="outline" className="bg-background/80 backdrop-blur">
              Ready to post
            </Badge>
          )}
        </div>
        {item.adStatus === "live" && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-pink-500 text-white border-0">
              <Megaphone className="h-3 w-3" /> Ads live
            </Badge>
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="text-sm font-medium leading-snug line-clamp-2">{item.title}</div>
        {posted ? (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {formatCount(item.likes)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> {formatCount(item.comments)}
            </span>
            <span className="flex items-center gap-1">
              <Play className="h-3.5 w-3.5" /> {formatCount(item.views)}
            </span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Caption {item.caption ? "ready ✓" : "missing"} · Hashtags{" "}
            {item.hashtags ? "ready ✓" : "missing"}
          </div>
        )}
      </div>
    </button>
  );
}

function formatCount(n: number | undefined): string {
  if (!n) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ──────────────────────────────────────────────────────────────────────────
 * "How it works" — the fifth-grader explainer
 * ────────────────────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      icon: PenLine,
      title: "1. Script",
      body: "Write what you're gonna say. Three parts: a hook (grabs them in 2 seconds), the body (the point), and a call-to-action (save, comment, DM).",
      example: "Hook: \"POV: you started an agency and it's broke.\"",
    },
    {
      icon: Video,
      title: "2. Shoot",
      body: "Film the video. Put it in your phone. Set a shoot date so it actually happens. One take is fine — don't overthink.",
      example: "Stand in good light. Look at the lens. Hit record. Done.",
    },
    {
      icon: Scissors,
      title: "3. Edit",
      body: "Cut the boring parts. Add captions (people watch with sound off). Music if it fits. Keep it under 60 seconds when you can.",
      example: "Assign it to an editor (yourself or someone else) and move the card.",
    },
    {
      icon: Send,
      title: "4. Post",
      body: "Drop it on Instagram. Paste the caption and hashtags you wrote in the card. Schedule it or post live.",
      example: "Open Instagram → Reels → upload → paste caption → share.",
    },
    {
      icon: Megaphone,
      title: "5. Ads",
      body: "When a post does well organically, boost it. Don't spend money on losers — only feed the winners. Start at $5–$20/day.",
      example: "Anything past 2× your average views = candidate for ads.",
    },
  ];

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
      <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> The whole thing in one sentence
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Write it → film it → edit it → post it → boost the winners. Then do it again. That's
          the flywheel. The more it spins, the easier each spin gets.
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.title} className="rounded-lg border bg-card p-4 flex gap-4">
              <div className="shrink-0 h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{s.title}</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.body}</p>
                <p className="text-xs italic text-muted-foreground/80 mt-2">{s.example}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold mb-2">How to use this board</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Click <b>New idea</b> to add a script you want to make.</li>
          <li>Drag a card right as it progresses through the stages.</li>
          <li>Click any card to fill in details (shoot date, editor, caption, ad budget).</li>
          <li>Once it hits <b>Post</b>, it shows up in the <b>Instagram</b> tab.</li>
          <li>Save the data lives in your browser — nothing else to set up.</li>
        </ul>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * New idea dialog
 * ────────────────────────────────────────────────────────────────────────── */

function NewIdeaDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (item: ContentItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [script, setScript] = useState("");

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate({
      id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      hook: hook.trim(),
      script: script.trim(),
      stage: "script",
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New content idea</DialogTitle>
          <DialogDescription>
            Just the basics — you can fill in the rest later as it moves through the flywheel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the video about?"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Hook (first 2 sec)</label>
            <Input
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="POV: ..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Script</label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Hook + body + call-to-action"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!title.trim()}>
            Create idea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Edit item dialog — adapts fields to the stage
 * ────────────────────────────────────────────────────────────────────────── */

function ItemDialog({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: ContentItem;
  onClose: () => void;
  onSave: (patch: Partial<ContentItem>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<ContentItem>(item);

  function set<K extends keyof ContentItem>(key: K, value: ContentItem[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const stageMeta = STAGES.find((s) => s.id === draft.stage)!;
  const StageIcon = stageMeta.icon;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StageIcon className="h-5 w-5" />
            {draft.title || "Untitled"}
          </DialogTitle>
          <DialogDescription>
            Stage: <b>{stageMeta.label}</b> — {stageMeta.tip}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <Field label="Title">
            <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Hook">
            <Input value={draft.hook} onChange={(e) => set("hook", e.target.value)} />
          </Field>
          <Field label="Script">
            <Textarea
              value={draft.script}
              onChange={(e) => set("script", e.target.value)}
              rows={5}
            />
          </Field>

          <Field label="Stage">
            <div className="flex gap-1.5 flex-wrap">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => set("stage", s.id)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md border transition-colors",
                    draft.stage === s.id
                      ? s.color + " font-medium"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          {draft.stage === "shoot" && (
            <Field label="Shoot date">
              <Input
                type="date"
                value={draft.shootDate ?? ""}
                onChange={(e) => set("shootDate", e.target.value)}
              />
            </Field>
          )}

          {draft.stage === "edit" && (
            <Field label="Editor">
              <Input
                value={draft.editor ?? ""}
                onChange={(e) => set("editor", e.target.value)}
                placeholder="Who's cutting this?"
              />
            </Field>
          )}

          {(draft.stage === "post" || draft.stage === "ads") && (
            <>
              <Field label="Caption">
                <Textarea
                  value={draft.caption ?? ""}
                  onChange={(e) => set("caption", e.target.value)}
                  rows={4}
                  placeholder="What goes under the post"
                />
              </Field>
              <Field label="Hashtags">
                <Input
                  value={draft.hashtags ?? ""}
                  onChange={(e) => set("hashtags", e.target.value)}
                  placeholder="#agency #contentmarketing"
                />
              </Field>
              <Field label="Instagram post URL">
                <Input
                  value={draft.postUrl ?? ""}
                  onChange={(e) => set("postUrl", e.target.value)}
                  placeholder="https://instagram.com/p/..."
                />
              </Field>
            </>
          )}

          {draft.stage === "ads" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Daily budget ($)">
                <Input
                  type="number"
                  min={0}
                  value={draft.adBudget ?? 0}
                  onChange={(e) => set("adBudget", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Ad status">
                <div className="flex gap-1.5">
                  {(["off", "live", "paused"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("adStatus", s)}
                      className={cn(
                        "flex-1 text-xs px-2 py-1.5 rounded-md border capitalize",
                        draft.adStatus === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <div className="flex gap-2">
            {draft.postUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={draft.postUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Open
                </a>
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const patch: Partial<ContentItem> = { ...draft };
                if (
                  draft.stage === "post" || draft.stage === "ads"
                ) {
                  patch.postedAt = draft.postedAt ?? new Date().toISOString();
                }
                onSave(patch);
              }}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}
