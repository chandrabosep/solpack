import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#9945ff]/40 focus:ring-1 focus:ring-[#9945ff]/30 min-h-16 w-full",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
