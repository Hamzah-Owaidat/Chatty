"use client";
import React, { useState } from "react";
import { Button } from "lebify-ui";
import { Mail, Send, Info, MailCheck, CircleAlert } from "lucide-react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { forgotPassword } from "@/lib/api/auth";
import { BackToSignIn, IconTile, emailPattern, errorInputClass, maskEmail, primaryButtonClass } from "./shared";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [requesting, setRequesting] = useState(false);
  const [sent, setSent] = useState(false);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(undefined);

    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!emailPattern.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setRequesting(true);
    try {
      await forgotPassword({ email });
    } catch {
      // Intentionally ignored: the backend never reveals whether an email is
      // registered, so the UI always shows the same generic confirmation,
      // even if the request itself happened to fail.
    } finally {
      setRequesting(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex w-full flex-col lg:w-[58%]">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <BackToSignIn />

          <div className="rounded-[20px] border border-gray-200/70 bg-white/70 p-6 text-center backdrop-blur-md dark:border-stone-700/70 dark:bg-stone-900/60">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1a7b9b]/25 bg-[#1a7b9b]/10 text-[#1a7b9b] dark:border-[#2596bb]/30 dark:bg-[#2596bb]/15 dark:text-[#60c7e3]">
              <MailCheck size={22} />
            </div>
            <h2 className="mb-1.5 text-lg font-semibold text-gray-800 dark:text-white/90">Check your inbox</h2>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              If an account exists for{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">{maskEmail(email)}</span>, we&apos;ve
              sent a link to reset your password.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col lg:w-[58%]">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <BackToSignIn />

        <IconTile>
          <Mail size={22} />
        </IconTile>
        <h1 className="mb-2 text-[30px] font-semibold -tracking-[.02em] text-gray-800 dark:text-white/90">
          Forgot your password?
        </h1>
        <p className="mb-8 text-sm text-gray-500 dark:text-stone-400">
          Enter the email linked to your account and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={submitRequest} className="space-y-5">
          <div>
            <Label htmlFor="forgot-email">
              Email {emailError && <span className="text-error-500">*</span>}
            </Label>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-stone-500" />
              <Input
                type="text"
                id="forgot-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`pl-10 ${emailError ? errorInputClass : ""}`}
                error={!!emailError}
                success={!emailError}
              />
            </div>
            {emailError && (
              <div className="flex items-center gap-1.5 pt-2 text-xs text-error-500">
                <CircleAlert size={14} />
                <p>{emailError}</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="sea"
            loading={requesting}
            loadingPosition="right"
            loadingSpinner="circle"
            hideTextWhenLoading
            icon={<Send size={17} />}
            iconPosition="right"
            className={primaryButtonClass}
          >
            Send reset link
          </Button>
        </form>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-gray-200 bg-[#f9fafb] px-3.5 py-3 dark:border-stone-700 dark:bg-white/[.03]">
          <Info size={16} className="mt-0.5 shrink-0 text-[#1a7b9b] dark:text-[#60c7e3]" />
          <p className="text-[12.5px] text-gray-500 dark:text-stone-400">
            Be sure to check your spam folder if the email doesn&apos;t arrive shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
