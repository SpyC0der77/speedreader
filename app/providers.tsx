"use client";

import { ReduceMotionProvider } from "@/lib/reduce-motion-context";
import { ReduceTransparencyProvider } from "@/lib/reduce-transparency-context";
import { ThemeProvider } from "@/lib/theme-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <ReduceTransparencyProvider>
          <ReduceMotionProvider>{children}</ReduceMotionProvider>
        </ReduceTransparencyProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
