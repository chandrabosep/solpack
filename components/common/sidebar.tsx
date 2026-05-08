"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectButton from "./connect-btn";
import { LayoutDashboard, FolderKanban, ScrollText } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/logs", label: "Logs", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-white/5 bg-[var(--surface)]/40 backdrop-blur-md">
      <div className="flex h-14 items-center border-b border-white/5 px-4">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight"
        >
          <span className="solana-gradient-text">sol</span>
          <span className="text-foreground">pack</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-gradient-to-r from-[#9945ff]/15 to-[#14f195]/10 text-foreground border border-[#9945ff]/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className={`size-4 shrink-0 ${active ? "text-[#14f195]" : ""}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/5 p-3">
        <ConnectButton />
      </div>
    </aside>
  );
}
