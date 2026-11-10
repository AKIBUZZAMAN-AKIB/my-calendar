import { formatDate } from "date-fns";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { cn } from "@/lib/utils";

export function TodayButton({ className }: { className?: string }) {
  const { setSelectedDate } = useCalendar();
  const today = new Date();

  return (
    <Button
      variant="outline"
      aria-label={`Go to today, ${formatDate(today, "EEEE, MMMM d")}`}
      title="Today"
      className={cn(
        "flex size-10 shrink-0 flex-col items-center justify-center gap-0 overflow-hidden p-0 lg:size-11",
        className,
      )}
      onClick={() => setSelectedDate(new Date())}
    >
      <span className="w-full bg-primary py-px text-[9px] font-semibold leading-tight text-primary-foreground lg:text-[10px]">
        {formatDate(today, "MMM").toUpperCase()}
      </span>
      <span className="flex-1 content-center text-sm font-bold leading-none lg:text-base">
        {today.getDate()}
      </span>
    </Button>
  );
}
