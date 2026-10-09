"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "lebify-ui";
import { CheckCircle2, CircleAlert, Loader2, Mail, Send } from "lucide-react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { confirmEmail, resendConfirmationEmail } from "@/lib/api/auth";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { BackToSignIn, IconTile, emailPattern, errorInputClass, primaryButtonClass } from "./shared";

type Status = "confirming" | "success" | "error";

export default function ConfirmEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("confirming");
  const [errorMessage, setErrorMessage] = useState("");
  const ranRef = useRef(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resendEmailError, setResendEmailError] = useState<string | undefined>();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!token) {
      setStatus("error");
      setErrorMessage("This confirmation link is invalid or has expired.");
      return;
    }

    (async () => {
      try {
        const res = await confirmEmail({ token });
        if (!res.isSuccess) {
          setStatus("error");
          setErrorMessage(res.error || "This confirmation link is invalid or has expired.");
          return;
        }
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage(getErrorMessage(err));
      }
    })();
  }, [token]);

  const submitResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendEmailError(undefined);

    if (!resendEmail) {
      setResendEmailError("Email is required");
      return;
    }
    if (!emailPattern.test(resendEmail)) {
      setResendEmailError("Please enter a valid email address");
      return;
    }

    setResending(true);
    try {
      const res = await resendConfirmationEmail({ email: resendEmail });
      if (!res.isSuccess) {
        showToast.error(res.error || "Failed to resend confirmation email");
        return;
      }
      setResent(true);
      showToast.success(res.message || "A new confirmation email has been sent. Please check your inbox.");
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  if (status === "confirming") {
    return (
      <div className="flex w-full flex-col lg:w-[58%]">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center text-center">
          <IconTile>
            <Loader2 size={22} className="animate-spin" />
          </IconTile>
          <h1 className="mb-2 text-[30px] font-semibold -tracking-[.02em] text-gray-800 dark:text-white/90">
            Confirming your email
          </h1>
          <p className="text-sm text-gray-500 dark:text-stone-400">Hang tight, this only takes a second.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex w-full flex-col lg:w-[58%]">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-success-500/25 bg-success-500/10 text-success-500 dark:border-success-400/30 dark:bg-success-400/15 dark:text-success-400">
            <CheckCircle2 size={22} />
          </div>
          <h1 className="mb-2 text-[30px] font-semibold -tracking-[.02em] text-gray-800 dark:text-white/90">
            Email confirmed
          </h1>
          <p className="mb-8 text-sm text-gray-500 dark:text-stone-400">
            Your email has been confirmed. You can now log in.
          </p>

          <Button type="button" variant="sea" className={primaryButtonClass} onClick={() => (window.location.href = "/auth/signin")}>
            Continue to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col lg:w-[58%]">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <BackToSignIn />

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-error-500/25 bg-error-500/10 text-error-500 dark:border-error-400/30 dark:bg-error-400/15 dark:text-error-400">
          <CircleAlert size={22} />
        </div>
        <h1 className="mb-2 text-[30px] font-semibold -tracking-[.02em] text-gray-800 dark:text-white/90">
          Link invalid or expired
        </h1>
        <p className="mb-8 text-sm text-gray-500 dark:text-stone-400">{errorMessage}</p>

        {resent ? (
          <div className="rounded-[20px] border border-gray-200/70 bg-white/70 p-6 text-center backdrop-blur-md dark:border-stone-700/70 dark:bg-stone-900/60">
            <p className="text-sm text-gray-500 dark:text-stone-400">
              A new confirmation email is on its way to{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">{resendEmail}</span>.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">
              Get a new confirmation link
            </p>
            <form onSubmit={submitResend} className="space-y-5">
              <div>
                <Label htmlFor="resend-email">
                  Email {resendEmailError && <span className="text-error-500">*</span>}
                </Label>
                <div className="relative">
                  <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-stone-500" />
                  <Input
                    type="text"
                    id="resend-email"
                    name="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={`pl-10 ${resendEmailError ? errorInputClass : ""}`}
                    error={!!resendEmailError}
                    success={!resendEmailError}
                  />
                </div>
                {resendEmailError && (
                  <div className="flex items-center gap-1.5 pt-2 text-xs text-error-500">
                    <CircleAlert size={14} />
                    <p>{resendEmailError}</p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="sea"
                loading={resending}
                loadingPosition="right"
                loadingSpinner="circle"
                hideTextWhenLoading
                icon={<Send size={17} />}
                iconPosition="right"
                className={primaryButtonClass}
              >
                Resend confirmation email
              </Button>
            </form>
          </>
        )}

        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-400">
          <Link href="/auth/signin" className="font-medium text-[#1a7b9b] underline underline-offset-2 hover:text-[#15657d] dark:text-[#60c7e3]">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
