"use client";

import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { Terminal, LogOut, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-indigo-400 font-bold text-lg">
              <Terminal className="h-6 w-6 text-indigo-500" />
              <span>DevPilot AI</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-rose-950/30 hover:border-rose-900 hover:text-white transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-300 hover:text-white mr-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
