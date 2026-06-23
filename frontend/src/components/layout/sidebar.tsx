"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  LayoutDashboard,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  projectId: string | number;
}

export function Sidebar({ projectId }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      name: "Overview",
      href: `/dashboard/project/${projectId}`,
      icon: LayoutDashboard,
    },
    {
      name: "Execution Console",
      href: `/dashboard/project/${projectId}/execute`,
      icon: Cpu,
    },
    {
      name: "Generated Documents",
      href: `/dashboard/project/${projectId}/documents`,
      icon: FileText,
    },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 border-b border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {links.map((link) => {
          const Icon = link.icon;
          // Subpaths like /execute or /documents are checked
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition",
                isActive
                  ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <Icon className={cn(
                "mr-3 h-5 w-5 flex-shrink-0 transition",
                isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200"
              )} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
