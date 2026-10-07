"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 500px at 85% -10%, rgba(26,123,155,.16), transparent 70%), radial-gradient(700px 400px at -10% 20%, rgba(96,199,227,.14), transparent 70%)",
        }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-2 md:pb-24 md:pt-20">
        <div className="animate-[floatIn_.6s_cubic-bezier(.2,.8,.2,1)_both]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1a7b9b]/25 bg-[#1a7b9b]/10 px-3 py-1 text-xs font-medium text-[#15657d] dark:border-[#2596bb]/30 dark:bg-[#2596bb]/15 dark:text-[#60c7e3]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#12b76a] opacity-60 motion-reduce:animate-none" />
              <span className="relative h-2 w-2 rounded-full bg-[#12b76a]" />
            </span>
            Live messaging, built in
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
            Conversations that keep up with you.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg dark:text-stone-300">
            Chatty brings direct messages, group chats, and invite links into one fast, real-time workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a7b9b] px-6 py-3 text-sm font-medium text-white shadow-[0_16px_30px_-16px_rgba(26,123,155,.85)] transition hover:-translate-y-0.5 hover:bg-[#166b87] dark:bg-[#2596bb] dark:hover:bg-[#2085a6]"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-white/5"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="relative flex h-[360px] w-full items-center justify-center sm:h-[460px]">
          <Image
            src="/images/illustrations/Hands - Phone.svg"
            alt="Hand holding a phone with a chat conversation"
            width={289}
            height={400}
            priority
            unoptimized
            className="h-full w-auto max-w-full object-contain drop-shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
