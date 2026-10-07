import { BellDot, Circle, Link2, MessageCircle, UserCheck, Users, type LucideIcon } from "lucide-react";
import { LANDING_FEATURES, LANDING_STEPS, type LandingFeature } from "./landing-data";

const ICONS: Record<LandingFeature["icon"], LucideIcon> = {
  message: MessageCircle,
  presence: Circle,
  group: Users,
  link: Link2,
  request: UserCheck,
  unread: BellDot,
};

export function FeaturesSection() {
  return (
    <section id="features" aria-labelledby="features-heading" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 id="features-heading" className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Everything you need to talk, nothing you don&apos;t
          </h2>
          <p className="mt-3 text-gray-600 dark:text-stone-300">
            Built around the conversations you actually have, from one-to-one chats to busy groups.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <li
                key={feature.id}
                className="group rounded-2xl border border-gray-200/70 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(16,24,40,.35)] dark:border-stone-800/70 dark:bg-stone-900"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a7b9b]/10 text-[#1a7b9b] transition group-hover:bg-[#1a7b9b] group-hover:text-white dark:bg-[#2596bb]/15 dark:text-[#60c7e3]">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-stone-300">{feature.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-20 border-y border-gray-200/70 bg-gray-50/60 py-16 sm:py-20 dark:border-stone-800/70 dark:bg-stone-900/40"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="how-heading" className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          How it works
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {LANDING_STEPS.map((step, index) => (
            <li key={step.id} className="relative rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,.04)] dark:bg-stone-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a7b9b] text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-stone-300">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
