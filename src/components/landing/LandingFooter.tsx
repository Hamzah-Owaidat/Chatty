import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ThemeResponsiveLogo from "@/components/common/ThemeResponsiveLogo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#stats", label: "Statistics" },
      { href: "#how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/auth/signup", label: "Create account" },
      { href: "/auth/signin", label: "Sign in" },
      { href: "/auth/reset-password", label: "Reset password" },
    ],
  },
  {
    title: "Chat",
    links: [
      { href: "/chat", label: "Open chat" },
      { href: "/profile", label: "Profile" },
    ],
  },
];

export function CtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] px-6 py-12 text-center shadow-[0_30px_60px_-30px_rgba(26,123,155,.8)] sm:px-12 sm:py-16">
        <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Start your first conversation today
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/85">
          Create an account in under a minute and invite the people you already talk to.
        </p>
        <Link
          href="/auth/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-[#15657d] shadow-[0_10px_20px_-12px_rgba(0,0,0,.4)] transition hover:-translate-y-0.5"
        >
          Get started
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-200/70 bg-white dark:border-stone-800/70 dark:bg-stone-950">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" aria-label="Chatty home" className="inline-flex">
            <ThemeResponsiveLogo className="h-7 w-auto" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-stone-400">
            Real-time chat for direct messages, groups, and invite links.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={`${column.title} links`}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{column.title}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("#") ? (
                    <a href={link.href} className="text-sm text-gray-600 transition hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:text-[#60c7e3]">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-gray-600 transition hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:text-[#60c7e3]">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-gray-200/70 px-4 py-6 text-center text-xs text-gray-500 sm:px-6 dark:border-stone-800/70 dark:text-stone-400">
        © {new Date().getFullYear()} Chatty. All rights reserved.
      </div>
    </footer>
  );
}
