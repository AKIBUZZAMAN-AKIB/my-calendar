"use client";

import { type ReactNode, useEffect, useState } from "react";

/**
 * Renders its children only in the browser. The calendar depends on the
 * device's own clock, time zone and saved events, none of which the server
 * knows, so server-rendered HTML would never match what the phone shows.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex h-dvh w-full items-center justify-center text-sm text-muted-foreground">
        Loading calendar…
      </div>
    );
  }
  return <>{children}</>;
}
