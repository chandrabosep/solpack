"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type V = "outline" | "ghost" | "default" | "secondary" | "destructive" | "link";
type S = "xs" | "default" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

export function CopyButton({
  value,
  label = "Copy",
  buttonText = "Copy",
  className,
  variant = "outline",
  size = "xs",
}: {
  value: string;
  label?: string;
  buttonText?: string;
  className?: string;
  variant?: V;
  size?: S;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={copy}
      aria-label={label}
    >
      {copied ? (
        <span className="text-emerald-600">Copied!</span>
      ) : (
        <>
          <Copy />
          {buttonText}
        </>
      )}
    </Button>
  );
}
