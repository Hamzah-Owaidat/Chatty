"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import ThemeResponsiveLogo from "@/components/common/ThemeResponsiveLogo";
import { useAppSelector } from "@/store/hooks";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#stats", label: "Statistics" },
  { href: "#how-it-works", label: "How it works" },
];

const LINK_CLASS =
  "rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white";

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const token = useAppSelector((state) => state.auth.token);
  const signedIn = !!token;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-md dark:border-stone-800/70 dark:bg-stone-950/80">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Chatty home" className="flex shrink-0 items-center">
          <ThemeResponsiveLogo className="h-7 w-auto" />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={LINK_CLASS}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a7b9b] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_20px_-12px_rgba(26,123,155,.8)] transition hover:bg-[#166b87] dark:bg-[#2596bb] dark:hover:bg-[#2085a6]"
            >
              Open chat
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className={LINK_CLASS}>
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a7b9b] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_20px_-12px_rgba(26,123,155,.8)] transition hover:bg-[#166b87] dark:bg-[#2596bb] dark:hover:bg-[#2085a6]"
              >
                Get started
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 md:hidden dark:text-stone-200 dark:hover:bg-white/5"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div id="landing-mobile-menu" className="border-t border-gray-200/70 bg-white px-4 pb-5 pt-3 md:hidden dark:border-stone-800/70 dark:bg-stone-950">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={closeMenu} className={`block ${LINK_CLASS}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            {signedIn ? (
              <Link
                href="/chat"
                onClick={closeMenu}
                className="rounded-xl bg-[#1a7b9b] px-4 py-2.5 text-center text-sm font-medium text-white dark:bg-[#2596bb]"
              >
                Open chat
              </Link>
            ) : (
              <>
                <Link href="/auth/signin" onClick={closeMenu} className={`block text-center ${LINK_CLASS}`}>
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={closeMenu}
                  className="rounded-xl bg-[#1a7b9b] px-4 py-2.5 text-center text-sm font-medium text-white dark:bg-[#2596bb]"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
