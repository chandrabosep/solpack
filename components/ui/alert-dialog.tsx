"use client";

import * as React from "react";
import { AlertDialog as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

const AlertDialog = Primitive.Root;
const AlertDialogTrigger = Primitive.Trigger;
const AlertDialogPortal = Primitive.Portal;

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Overlay>) {
  return (
    <Primitive.Overlay
      className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <Primitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-white/10 bg-[var(--surface)] p-6 shadow-2xl shadow-purple-900/30 outline-none",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Title>) {
  return (
    <Primitive.Title
      className={cn("text-base font-semibold leading-none", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof Primitive.Action> &
  VariantProps<typeof buttonVariants>) {
  return (
    <Primitive.Action
      className={cn(buttonVariants({ variant: variant ?? "default" }), className)}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Cancel>) {
  return (
    <Primitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
