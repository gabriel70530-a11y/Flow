"use client";

import { Eraser, Pencil, Trash2, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

type Ink = "text" | "accent" | "danger";
type Tool = "lapis" | "borracha";

interface Stroke {
  tool: Tool;
  ink: Ink;
  width: number;
  points: [number, number][];
}

const INKS: { value: Ink; label: string }[] = [
  { value: "text", label: "Tinta escura" },
  { value: "accent", label: "Tinta azul" },
  { value: "danger", label: "Tinta vermelha" },
];
const WIDTHS = [
  { value: 2, label: "Traço fino" },
  { value: 5, label: "Traço grosso" },
];
const ERASER_SCALE = 5;

// O rascunho é de cada questão e fica só na memória do aparelho enquanto o app está aberto: não salva nem sincroniza.
const sketches = new Map<string, Stroke[]>();

function inkColor(ink: Ink): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${ink}`).trim() || "#000";
}

function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke) {
  const [first, ...rest] = stroke.points;
  if (!first) return;
  context.globalCompositeOperation = stroke.tool === "borracha" ? "destination-out" : "source-over";
  context.strokeStyle = inkColor(stroke.ink);
  context.fillStyle = context.strokeStyle;
  context.lineWidth = stroke.tool === "borracha" ? stroke.width * ERASER_SCALE : stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  if (rest.length === 0) {
    context.beginPath();
    context.arc(first[0], first[1], context.lineWidth / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }
  context.beginPath();
  context.moveTo(first[0], first[1]);
  for (const [x, y] of rest) context.lineTo(x, y);
  context.stroke();
}

function paint(canvas: HTMLCanvasElement | null, strokes: Stroke[]) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;
  const ratio = window.devicePixelRatio || 1;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) drawStroke(context, stroke);
}

function ToolButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-hover hover:text-text aria-pressed:bg-action aria-pressed:text-on-action"
    >
      {children}
    </button>
  );
}

function Board({ sketchKey }: { sketchKey: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>(() => sketches.get(sketchKey) ?? []);
  const [tool, setTool] = useState<Tool>("lapis");
  const [ink, setInk] = useState<Ink>("text");
  const [width, setWidth] = useState(WIDTHS[0].value);
  const drawing = useRef<Stroke | null>(null);

  useEffect(() => {
    sketches.set(sketchKey, strokes);
  }, [sketchKey, strokes]);

  // O canvas acompanha o tamanho do quadro (e a densidade da tela); os traços são redesenhados a cada mudança.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
      paint(canvas, sketches.get(sketchKey) ?? []);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const theme = new MutationObserver(() => paint(canvas, sketches.get(sketchKey) ?? []));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      observer.disconnect();
      theme.disconnect();
    };
  }, [sketchKey]);

  useEffect(() => paint(canvasRef.current, strokes), [strokes]);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = { tool, ink, width, points: [point(event)] };
    paint(canvasRef.current, [...strokes, drawing.current]);
  };

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = drawing.current;
    if (!stroke) return;
    stroke.points.push(point(event));
    paint(canvasRef.current, [...strokes, stroke]);
  };

  const end = () => {
    const stroke = drawing.current;
    drawing.current = null;
    if (stroke) setStrokes([...strokes, stroke]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Ferramentas do rascunho">
        <ToolButton label="Lápis" pressed={tool === "lapis"} onClick={() => setTool("lapis")}>
          <Pencil size={17} aria-hidden />
        </ToolButton>
        <ToolButton label="Borracha" pressed={tool === "borracha"} onClick={() => setTool("borracha")}>
          <Eraser size={17} aria-hidden />
        </ToolButton>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden />
        {INKS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            title={option.label}
            aria-pressed={ink === option.value && tool === "lapis"}
            onClick={() => {
              setInk(option.value);
              setTool("lapis");
            }}
            className="grid size-9 place-items-center rounded-full hover:bg-hover aria-pressed:bg-hover"
          >
            <span
              className={`size-4 rounded-full ${ink === option.value && tool === "lapis" ? "ring-2 ring-edge ring-offset-2 ring-offset-surface" : ""}`}
              style={{ background: `var(--${option.value})` }}
            />
          </button>
        ))}
        {WIDTHS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            title={option.label}
            aria-pressed={width === option.value}
            onClick={() => setWidth(option.value)}
            className="grid size-9 place-items-center rounded-full hover:bg-hover aria-pressed:bg-hover"
          >
            <span className="rounded-full bg-text" style={{ width: option.value + 4, height: option.value + 4 }} />
          </button>
        ))}
        <span className="ml-auto flex">
          <ToolButton label="Desfazer" onClick={() => setStrokes(strokes.slice(0, -1))}>
            <Undo2 size={17} aria-hidden />
          </ToolButton>
          <ToolButton label="Limpar o rascunho" onClick={() => setStrokes([])}>
            <Trash2 size={17} aria-hidden />
          </ToolButton>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Rascunho: desenhe com o mouse, o dedo ou a caneta"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className={`min-h-0 w-full flex-1 touch-none rounded-[12px] border border-line bg-bg ${tool === "borracha" ? "cursor-cell" : "cursor-crosshair"}`}
      />
    </div>
  );
}

// Quadro ao lado da questão, no computador. Quem usa define a altura e a posição (sticky).
export function ScratchPanel({ sketchKey, className = "" }: { sketchKey: string; className?: string }) {
  return (
    <section aria-label="Rascunho" className={`flex-col gap-2 rounded-[18px] border border-line bg-surface p-4 ${className}`}>
      <h2 className="text-base">Rascunho</h2>
      <Board key={sketchKey} sketchKey={sketchKey} />
    </section>
  );
}

// No celular, o mesmo quadro abre em tela cheia por cima da questão.
export function ScratchSheet({ sketchKey, title, onClose }: { sketchKey: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Rascunho da ${title}`}
      className="fixed inset-0 z-40 flex flex-col gap-3 bg-surface pt-[max(12px,env(safe-area-inset-top))] pr-[max(12px,env(safe-area-inset-right))] pb-[max(12px,env(safe-area-inset-bottom))] pl-[max(12px,env(safe-area-inset-left))]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base">Rascunho · {title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar o rascunho"
          className="grid size-10 place-items-center rounded-full bg-hover text-text"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <Board key={sketchKey} sketchKey={sketchKey} />
    </div>
  );
}
