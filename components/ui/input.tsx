import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "h-9 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-[#9945ff]/40 focus-visible:ring-1 focus-visible:ring-[#9945ff]/30 disabled:opacity-50 w-full",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
