"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "lebify-ui";
import { Lock, CircleAlert } from "lucide-react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { resetPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import {
  BackToSignIn,
  IconTile,
  PasswordStrengthMeter,
  errorInputClass,
  passwordPattern,
  primaryButtonClass,
} from "./shared";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [passwords, setPasswords] = useState({ newPassword: "", confirmNewPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<{ newPassword?: string; confirmNewPassword?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    const newErrors: { newPassword?: string; confirmNewPassword?: string } = {};
    if (!passwords.newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (!passwordPattern.test(passwords.newPassword)) {
      newErrors.newPassword = "Password must be at least 8 characters long, contain at least one uppercase letter and one digit.";
    }
    if (!passwords.confirmNewPassword) {
      newErrors.confirmNewPassword = "Please confirm your new password";
    } else if (passwords.confirmNewPassword !== passwords.newPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    setResetting(true);
    try {
      await resetPassword({ token: token || "", ...passwords });
      showToast.success("Your password has been reset. You can now log in with your new password.");
      router.push("/auth/signin");
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex w-full flex-col lg:w-[58%]">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <BackToSignIn />

          <IconTile>
            <CircleAlert size={22} />
          </IconTile>
          <h1 className="mb-2 text-[30px] font-semibold -tracking-[.02em] text-gray-800 dark:text-white/90">
            This link is invalid
          </h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-stone-400">
            This password reset link is missing or malformed. Request a new one to continue.
          </p>

          <Button
            type="button"
            variant="sea"
            className={primaryButtonClass}
            onClick={() => router.push("/auth/forgot-password")}
          >
            Request a new link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col lg:w-[58%]">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <BackToSignIn />

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
            <Label htmlFor="new-password">
              New password {passwordErrors.newPassword && <span className="text-error-500">*</span>}
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                id="new-password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your new password"
                className={`pr-11 ${passwordErrors.newPassword ? errorInputClass : ""}`}
                error={!!passwordErrors.newPassword}
                success={!passwordErrors.newPassword}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide new password" : "Show new password"}
                className="absolute right-1.5 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[9px] transition-colors duration-150 hover:bg-[#1a7b9b]/10 dark:hover:bg-[#2596bb]/15"
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                )}
              </button>
            </div>

            <PasswordStrengthMeter password={passwords.newPassword} />

            {passwordErrors.newPassword && (
              <div className="flex items-center gap-1.5 pt-2 text-xs text-error-500">
                <CircleAlert size={14} />
                <p>{passwordErrors.newPassword}</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirm-new-password">
              Confirm new password {passwordErrors.confirmNewPassword && <span className="text-error-500">*</span>}
            </Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-new-password"
                name="confirmNewPassword"
                value={passwords.confirmNewPassword}
                onChange={handlePasswordChange}
                placeholder="Re-enter your new password"
                className={`pr-11 ${passwordErrors.confirmNewPassword ? errorInputClass : ""}`}
                error={!!passwordErrors.confirmNewPassword}
                success={!passwordErrors.confirmNewPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                className="absolute right-1.5 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[9px] transition-colors duration-150 hover:bg-[#1a7b9b]/10 dark:hover:bg-[#2596bb]/15"
              >
                {showConfirmPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.confirmNewPassword && (
              <div className="flex items-center gap-1.5 pt-2 text-xs text-error-500">
                <CircleAlert size={14} />
                <p>{passwordErrors.confirmNewPassword}</p>
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
