"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "系统首页", href: "/", short: "首" },
  { label: "记录回放", href: "/record", short: "记" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-screen flex-col border-r border-dashboard-border bg-dashboard-panel text-dashboard-text transition-all duration-300 ${collapsed ? "w-20" : "w-64"
        }`}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-dashboard-accent text-sm font-semibold text-black">
            T
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-dashboard-text">
              TBI 系统
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded border border-dashboard-border text-xs text-dashboard-muted hover:bg-dashboard-bg"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === item.href
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active
                ? "bg-dashboard-bg text-dashboard-text"
                : "text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-text"
                }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${active
                  ? "bg-dashboard-accent text-black"
                  : "bg-dashboard-bg text-dashboard-muted"
                  }`}
              >
                {item.short}
              </div>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

