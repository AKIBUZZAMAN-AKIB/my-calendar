"use client";

import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/responsive-modal";
import { useMediaQuery } from "@/features/calendar/hooks";
import { cn } from "@/lib/utils";

interface AdaptivePanelProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  className?: string;
}

/**
 * A popover on desktop, a bottom sheet on phones / tablets.
 */
export function AdaptivePanel({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  align = "end",
  className,
}: AdaptivePanelProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align={align}
          collisionPadding={8}
          className={cn(
            "w-80 max-h-[min(80vh,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain p-3",
            className,
          )}
        >
          <p className="mb-2 px-1 text-sm font-semibold">{title}</p>
          {children}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalTrigger asChild>{trigger}</ModalTrigger>
      <ModalContent className="flex flex-col gap-3">
        <ModalHeader className="text-left">
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription id="responsive-modal-description" className={description ? "" : "sr-only"}>
            {description ?? title}
          </ModalDescription>
        </ModalHeader>
        {children}
      </ModalContent>
    </Modal>
  );
}
