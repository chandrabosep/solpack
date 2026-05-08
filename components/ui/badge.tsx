import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "h-5 gap-1 rounded-md border border-transparent px-2 py-0.5 text-[11px] font-medium inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background",
        secondary: "bg-white/5 text-foreground border-white/10",
        outline: "border-border text-foreground",
        destructive: "bg-rose-500/10 text-rose-300 border-rose-400/20",
        success: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
