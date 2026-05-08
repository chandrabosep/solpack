import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive rounded-lg border border-transparent text-xs font-medium focus-visible:ring-1 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none select-none gap-1.5",
  {
    variants: {
      variant: {
        default:
          "bg-[image:var(--gradient-solana)] text-[#0a0612] hover:brightness-105 shadow-sm",
        outline: "border-white/10 bg-white/5 text-foreground hover:bg-white/10",
        secondary: "bg-white/10 text-foreground hover:bg-white/15",
        ghost: "hover:bg-white/5 hover:text-foreground",
        destructive:
          "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3",
        xs: "h-6 px-2 text-xs rounded-md",
        sm: "h-8 px-2.5 rounded-md",
        lg: "h-10 px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
