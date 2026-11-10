import type { ISubject } from "@/features/calendar/interfaces";
import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-indigo-500",
  "bg-lime-600",
];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function subjectColorClass(subject: Pick<ISubject, "id">) {
  return PALETTE[hash(subject.id) % PALETTE.length];
}

let segmenter: Intl.Segmenter | null | undefined;
const initials = new Map<string, string>();

/** First visible character of the name (works for Bangla and emoji too). Cached. */
export function subjectInitial(name: string) {
  const cached = initials.get(name);
  if (cached !== undefined) return cached;
  const trimmed = name.trim();
  let result = "#";
  if (trimmed) {
    if (segmenter === undefined) {
      try {
        segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      } catch {
        segmenter = null; // Intl.Segmenter missing
      }
    }
    const first = segmenter?.segment(trimmed)[Symbol.iterator]().next().value;
    result = (first ? first.segment : Array.from(trimmed)[0]).toLocaleUpperCase();
  }
  if (initials.size > 500) initials.clear();
  initials.set(name, result);
  return result;
}

/** A small square with the subject's first letter, always the same size. */
export function SubjectIcon({
  subject,
  className,
}: {
  subject: Pick<ISubject, "id" | "name">;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md text-[11px] font-semibold leading-none text-white",
        subjectColorClass(subject),
        className,
      )}
    >
      {subjectInitial(subject.name)}
    </span>
  );
}
