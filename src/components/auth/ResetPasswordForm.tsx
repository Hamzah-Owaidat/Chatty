"use client";
import React, { useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "lebify-ui";
import { ArrowLeft, Lock, Mail, Send, Info, MailCheck, CircleAlert } from "lucide-react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { requestPasswordReset, resetPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { useRouter } from "next/navigation";

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";
const RESEND_COOLDOWN_SECONDS = 30;

const errorInputClass = "border-error-500! focus:border-error-500! focus:ring-error-500/12!";

const primaryButtonClass = `w-full rounded-2xl! bg-gradient-to-br! from-[#1f88aa] via-[#1a7b9b] to-[#17708d] shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_1px_2px_rgba(16,24,40,.04),0_16px_30px_-16px_rgba(26,123,155,.75)]! ${EASE} active:scale-[.985]!`;

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 1))}@${domain}`;
};

const StepIndicator = ({ currentIndex }: { currentIndex: number }) => {
  const steps = ["Email", "Verify", "New password"];
  return (
    <div className="mb-8 flex items-center">
      {steps.map((label, i) => {
        const isCurrent = i === currentIndex;
        return (
          <Fragment key={label}>
            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-full ${
                isCurrent ? "bg-[#1a7b9b]/10 px-2.5 py-1 dark:bg-[#2596bb]/15" : ""
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  isCurrent
                    ? "bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-stone-700 dark:text-stone-400"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-[11px] font-medium ${
                  isCurrent ? "text-[#1a7b9b] dark:text-[#60c7e3]" : "text-gray-400 dark:text-stone-500"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="mx-1.5 h-px flex-1"
                style={{ backgroundImage: "repeating-linear-gradient(90deg,#d0d5dd 0 4px,transparent 4px 8px)" }}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

const BackToSignIn = () => (
  <Link
    href="/auth/signin"
    className={`group mb-8 inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-all duration-200 ${EASE} hover:-translate-x-0.5 hover:text-[#1a7b9b] dark:border-stone-700 dark:bg-[#292524] dark:text-stone-300 dark:hover:text-[#60c7e3]`}
  >
    <ArrowLeft size={14} />
    Back to sign in
  </Link>
);

const IconTile = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1a7b9b]/25 bg-[#1a7b9b]/10 text-[#1a7b9b] dark:border-[#2596bb]/30 dark:bg-[#2596bb]/15 dark:text-[#60c7e3]">
    {children}
  </div>
);

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [requesting, setRequesting] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

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
      await requestPasswordReset(email);
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setRequesting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || requesting) return;
    setRequesting(true);
    try {
      await requestPasswordReset(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      showToast.success("Reset link sent again!");
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setRequesting(false);
    }
  };

  // Presentational-only strength meter, mirrors SignUpForm's rules.
  const pwd = passwords.password;
  const hasLength = pwd.length >= 8;
  const hasDigit = /\d/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const strengthScore = [hasDigit, hasUpper, hasLength].filter(Boolean).length;
  const strengthLabel = !pwd
    ? ""
    : !hasDigit
    ? "Add a digit"
    : !hasUpper
    ? "Add an uppercase letter"
    : !hasLength
    ? "Use 8+ characters"
    : "Strong password";
  const strengthFilledClass = strengthScore >= 3 ? "bg-success-500 dark:bg-success-400" : "bg-warning-400";

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (!passwords.password) {
      newErrors.password = "Password is required";
    } else if (!passwordPattern.test(passwords.password)) {
      newErrors.password = "Password must be at least 8 characters long, contain at least one uppercase letter and one digit.";
    }
    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwords.confirmPassword !== passwords.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    setResetting(true);
    try {
      await resetPassword({ token: token || "", password: passwords.password });
      showToast.success("Password updated! Please sign in.");
      router.push("/auth/signin");
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  if (token) {
    return (
      <div className="flex w-full flex-col lg:w-[58%]">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <BackToSignIn />
          <StepIndicator currentIndex={2} />

          <IconTile>
            <Lock size={22} />
          </IconTile>
          <h1 className="mb-2 text-[30px] font-semibold -tracking-[.02em] text-gray-800 dark:text-white/90">
            Set a new password
          </h1>
          <p className="mb-8 text-sm text-gray-500 dark:text-stone-400">
            Choose a new password for your account.
          </p>

          <form onSubmit={submitNewPassword} className="space-y-5">
            <div>
              <Label>
                New password {passwordErrors.password && <span className="text-error-500">*</span>}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={passwords.password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your new password"
                  className={`pr-11 ${passwordErrors.password ? errorInputClass : ""}`}
                  error={!!passwordErrors.password}
                  success={!passwordErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[9px] transition-colors duration-150 hover:bg-[#1a7b9b]/10 dark:hover:bg-[#2596bb]/15"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </button>
              </div>

              {pwd && (
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
              )}

              {passwordErrors.password && (
                <div className="flex items-center gap-1.5 pt-2 text-xs text-error-500">
                  <CircleAlert size={14} />
                  <p>{passwordErrors.password}</p>
                </div>
              )}
            </div>

            <div>
              <Label>
                Confirm new password {passwordErrors.confirmPassword && <span className="text-error-500">*</span>}
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Re-enter your new password"
                  className={`pr-11 ${passwordErrors.confirmPassword ? errorInputClass : ""}`}
                  error={!!passwordErrors.confirmPassword}
                  success={!passwordErrors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[9px] transition-colors duration-150 hover:bg-[#1a7b9b]/10 dark:hover:bg-[#2596bb]/15"
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <div className="flex items-center gap-1.5 pt-2 text-xs text-error-500">
                  <CircleAlert size={14} />
                  <p>{passwordErrors.confirmPassword}</p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="sea"
              loading={resetting}
              loadingPosition="right"
              loadingSpinner="circle"
              hideTextWhenLoading
              className={primaryButtonClass}
            >
              Save new password
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex w-full flex-col lg:w-[58%]">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <BackToSignIn />
          <StepIndicator currentIndex={1} />

          <div className="rounded-[20px] border border-gray-200/70 bg-white/70 p-6 text-center backdrop-blur-md dark:border-stone-700/70 dark:bg-stone-900/60">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1a7b9b]/25 bg-[#1a7b9b]/10 text-[#1a7b9b] dark:border-[#2596bb]/30 dark:bg-[#2596bb]/15 dark:text-[#60c7e3]">
              <MailCheck size={22} />
            </div>
            <h2 className="mb-1.5 text-lg font-semibold text-gray-800 dark:text-white/90">Reset link sent</h2>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              We sent a password reset link to{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">{maskEmail(email)}</span>
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || requesting}
              className={`mt-4 text-sm font-medium text-[#1a7b9b] transition-colors duration-150 hover:text-[#15657d] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#60c7e3]`}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col lg:w-[58%]">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <BackToSignIn />
        <StepIndicator currentIndex={0} />

        <IconTile>
          <Lock size={22} />
        </IconTile>
        <h1 className="mb-2 text-[30px] font-semibold -tracking-[.02em] text-gray-800 dark:text-white/90">
          Reset your password
        </h1>
        <p className="mb-8 text-sm text-gray-500 dark:text-stone-400">
          Enter the email linked to your account and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={submitRequest} className="space-y-5">
          <div>
            <Label>
              Email {emailError && <span className="text-error-500">*</span>}
            </Label>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-stone-500" />
              <Input
                type="text"
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
            The reset link expires in 30 minutes. Be sure to check your spam folder if it doesn&apos;t arrive shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
