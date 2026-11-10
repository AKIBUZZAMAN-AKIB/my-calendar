"use client";

import { Minus, Plus, SettingsIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  MAX_SCROLL_HOUR,
  MIN_SCROLL_HOUR,
  useCalendar,
} from "@/features/calendar/contexts/calendar-context";
import { AdaptivePanel } from "@/features/calendar/header/adaptive-panel";
import { cn } from "@/lib/utils";

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-1">
      <div className="flex flex-col">
        <span className="text-sm">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex h-9 rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 text-sm transition-colors",
            value === o.value
              ? "bg-background font-medium shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Settings() {
  const {
    badgeVariant,
    setBadgeVariant,
    use24HourFormat,
    toggleTimeFormat,
    startOfDayHour,
    setStartOfDayHour,
    agendaModeGroupBy,
    setAgendaModeGroupBy,
  } = useCalendar();
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const hourLabel = (h: number) =>
    use24HourFormat
      ? `${String(h).padStart(2, "0")}:00`
      : `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

  return (
    <AdaptivePanel
      title="Calendar settings"
      trigger={
        <Button
          variant="outline"
          size="icon"
          aria-label="Calendar settings"
          data-header-btn="settings"
          className="size-10 shrink-0"
        >
          <SettingsIcon className="size-4" />
        </Button>
      }
    >
      <div className="flex flex-col divide-y">
        <Row label="Dark mode">
          <Switch
            aria-label="Dark mode"
            checked={isDarkMode}
            onCheckedChange={(c) => setTheme(c ? "dark" : "light")}
          />
        </Row>
        <Row label="Event style">
          <Segmented
            value={badgeVariant}
            onChange={setBadgeVariant}
            options={[
              { value: "colored", label: "Color" },
              { value: "dot", label: "Dot" },
            ]}
          />
        </Row>
        <Row label="Time format">
          <Segmented
            value={use24HourFormat ? "24" : "12"}
            onChange={(v) => {
              if ((v === "24") !== use24HourFormat) toggleTimeFormat();
            }}
            options={[
              { value: "12", label: "12h" },
              { value: "24", label: "24h" },
            ]}
          />
        </Row>
        <Row label="Day starts at" hint="Week & day view scroll here">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="Earlier"
              disabled={startOfDayHour <= MIN_SCROLL_HOUR}
              onClick={() => setStartOfDayHour(Math.max(MIN_SCROLL_HOUR, startOfDayHour - 1))}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-16 text-center text-sm tabular-nums" data-start-hour>
              {hourLabel(startOfDayHour)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="Later"
              disabled={startOfDayHour >= MAX_SCROLL_HOUR}
              onClick={() => setStartOfDayHour(Math.min(MAX_SCROLL_HOUR, startOfDayHour + 1))}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </Row>
        <Row label="Agenda groups by">
          <Segmented
            value={agendaModeGroupBy}
            onChange={setAgendaModeGroupBy}
            options={[
              { value: "date", label: "Date" },
              { value: "color", label: "Color" },
            ]}
          />
        </Row>
      </div>
    </AdaptivePanel>
  );
}
