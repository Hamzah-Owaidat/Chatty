import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const errorInputClass = "border-error-500! focus:border-error-500! focus:ring-error-500/12!";

export const primaryButtonClass = `w-full rounded-2xl! bg-gradient-to-br! from-[#1f88aa] via-[#1a7b9b] to-[#17708d] shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_1px_2px_rgba(16,24,40,.04),0_16px_30px_-16px_rgba(26,123,155,.75)]! ${EASE} active:scale-[.985]!`;

export const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 1))}@${domain}`;
};

export const BackToSignIn = () => (
  <Link
    href="/auth/signin"
    className={`group mb-8 inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-all duration-200 ${EASE} hover:-translate-x-0.5 hover:text-[#1a7b9b] dark:border-stone-700 dark:bg-[#292524] dark:text-stone-300 dark:hover:text-[#60c7e3]`}
  >
    <ArrowLeft size={14} />
    Back to sign in
  </Link>
);

export const IconTile = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1a7b9b]/25 bg-[#1a7b9b]/10 text-[#1a7b9b] dark:border-[#2596bb]/30 dark:bg-[#2596bb]/15 dark:text-[#60c7e3]">
    {children}
  </div>
);

export const PasswordStrengthMeter = ({ password }: { password: string }) => {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasDigit = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const strengthScore = [hasDigit, hasUpper, hasLength].filter(Boolean).length;
  const strengthLabel = !hasDigit
    ? "Add a digit"
    : !hasUpper
    ? "Add an uppercase letter"
    : !hasLength
    ? "Use 8+ characters"
    : "Strong password";
  const strengthFilledClass = strengthScore >= 3 ? "bg-success-500 dark:bg-success-400" : "bg-warning-400";

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i < strengthScore ? strengthFilledClass : "bg-[#eceef2] dark:bg-stone-700"
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11.5px] text-gray-500 dark:text-stone-400">{strengthLabel}</p>
    </div>
  );
};
