import Link from "next/link";

import { getCurrentUser } from "@/lib/session";

import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/dashboard" className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          Habit Tracker
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/challenges" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100">
            Challenges
          </Link>
          <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline">{user?.email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
