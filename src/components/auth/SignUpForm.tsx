"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { CircleAlert, ArrowRight } from "lucide-react";
import { Button } from "lebify-ui";
import Link from "next/link";
import React, { useState } from "react";
import { register } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { RegisterData } from "@/types/auth/auth.models";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import ThemeResponsiveLogo from "@/components/common/ThemeResponsiveLogo";

interface SignUpFormErrors {
  userName?: string;
  displayName?: string;
  email?: string;
  password?: string;
  checkbox?: string;
  general?: string;
}

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

const errorInputClass = "border-error-500! focus:border-error-500! focus:ring-error-500/12!";

const ErrorRow = ({ message }: { message: string }) => (
  <div className="flex items-center gap-1.5 text-error-500 text-xs pt-2">
    <CircleAlert size={14} />
    <p>{message}</p>
  </div>
);

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    userName: "",
    displayName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SignUpFormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Basic validation
    const newErrors: SignUpFormErrors = {};
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.userName) newErrors.userName = "Username is required";

    if (!formData.displayName) newErrors.displayName = "Display Name is required";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailPattern.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordPattern.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters long, contain at least one uppercase letter and one digit.";
    }

    if (!isChecked) newErrors.checkbox = "You must agree to the terms conditions and privacy policy";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const data = await register(formData as RegisterData);
      localStorage.setItem("token", data.token);
      router.push("/auth/signin");
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Presentational-only strength meter driven by the existing password pattern's rules.
  const pwd = formData.password;
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

  return (
    <div className="flex w-full flex-col overflow-y-auto no-scrollbar py-12 lg:w-[58%]">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <div>
          <div className="mb-8">
            <ThemeResponsiveLogo className="mb-6 h-7 w-auto" />
            <h1 className="mb-2 text-[30px] font-semibold -tracking-[.02em] text-gray-800 dark:text-white/90">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              Enter your data to sign up!
            </p>
          </div>
          <div>
            <button
              type="button"
              className={`mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-all duration-200 ${EASE} hover:-translate-y-px hover:shadow-[0_10px_20px_-14px_rgba(16,24,40,.35)] dark:border-stone-700 dark:bg-[#292524] dark:text-white/90`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                  fill="#4285F4"
                />
                <path
                  d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                  fill="#34A853"
                />
                <path
                  d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                  fill="#FBBC05"
                />
                <path
                  d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                  fill="#EB4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="mb-6 flex items-center gap-3">
              <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #e4e7ec)" }} />
              <span className="text-[11.5px] font-medium uppercase tracking-wide text-gray-400 dark:text-stone-500">
                Or
              </span>
              <span className="h-px flex-1" style={{ background: "linear-gradient(270deg, transparent, #e4e7ec)" }} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5">

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {/* <!-- UserName --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Username {errors.userName && (<span className="text-error-500">*</span>)}
                    </Label>
                    <div className="relative">
                      <Input
                        id="uname"
                        name="userName"
                        type="text"
                        value={formData.userName}
                        placeholder="Enter your username"
                        onChange={handleChange}
                        className={errors.userName ? errorInputClass : undefined}
                        error={!!errors.userName}
                        success={!errors.userName}
                      />
                    </div>
                    {errors.userName && <ErrorRow message={errors.userName} />}
                  </div>

                  {/* <!-- Display Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Display Name {errors.displayName && (<span className="text-error-500">*</span>)}
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        placeholder="Enter your display name"
                        className={errors.displayName ? errorInputClass : undefined}
                        error={!!errors.displayName}
                        success={!errors.displayName}
                      />
                    </div>
                    {errors.displayName && <ErrorRow message={errors.displayName} />}
                  </div>
                </div>

                {/* <!-- Email --> */}
                <div>
                  <Label>
                    Email {errors.email && (<span className="text-error-500">*</span>)}
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className={errors.email ? errorInputClass : undefined}
                      error={!!errors.email}
                      success={!errors.email}
                    />
                  </div>
                  {errors.email && <ErrorRow message={errors.email} />}
                </div>

                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Password {errors.password && (<span className="text-error-500">*</span>)}
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pr-11 ${errors.password ? errorInputClass : ""}`}
                      error={!!errors.password}
                      success={!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-1.5 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[9px] transition-colors duration-150 hover:bg-[#1a7b9b]/10 dark:hover:bg-[#2596bb]/15`}
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

                  {errors.password && <ErrorRow message={errors.password} />}
                </div>

                {/* <!-- Checkbox --> */}
                <div className="rounded-2xl border border-gray-200 bg-[#f9fafb] px-3.5 py-3 dark:border-stone-700 dark:bg-white/[.03]">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <p className="inline-block text-sm font-normal text-gray-500 dark:text-gray-400">
                      By creating an account means you agree to the{" "}
                      <span className="text-gray-800 dark:text-white/90">
                        Terms and Conditions,{" "}
                      </span>
                      and our{" "}
                      <span className="text-gray-800 dark:text-white">
                        Privacy Policy
                      </span>
                    </p>
                  </div>
                  {errors.checkbox && <ErrorRow message={errors.checkbox} />}
                </div>

                {/* <!-- Button --> */}
                <div className="mt-1">
                  <Button
                    type="submit"
                    variant="sea"
                    loading={loading}
                    loadingPosition="right"
                    loadingSpinner="circle"
                    hideTextWhenLoading
                    icon={<ArrowRight size={18} />}
                    iconPosition="right"
                    className={`flex w-full items-center justify-center rounded-2xl! bg-gradient-to-br! from-[#1f88aa] via-[#1a7b9b] to-[#17708d] shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_1px_2px_rgba(16,24,40,.04),0_16px_30px_-16px_rgba(26,123,155,.75)]! ${EASE} active:scale-[.985]!`}
                  >
                    Create account
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="text-[#1a7b9b] hover:text-[#15657d] dark:text-[#60c7e3]"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
