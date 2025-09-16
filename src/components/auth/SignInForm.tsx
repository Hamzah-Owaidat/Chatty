"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Button } from "lebify-ui";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser } from "@/store/slices/authSlice";
import { unwrapResult } from "@reduxjs/toolkit";
import { getErrorMessage } from "@/utils/error";
import { LoginCredentials } from "@/types/auth/auth.models";
import { showToast } from "@/utils/toast";

interface SignInFormErrors {
  userName?: string;
  password?: string;
  general?: string;
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({ userName: "", password: "" });
  const [errors, setErrors] = useState<SignInFormErrors>({});

  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: SignInFormErrors = {};
    if (!formData.userName) newErrors.userName = "Username is required";
    if (!formData.password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const action = await dispatch(loginUser(formData as LoginCredentials));
      const result = unwrapResult(action);
      console.log("Logged in user:", result?.user);
      showToast.success("Logged in successfully!");
      router.push("/chat");
    } catch (err) {
      showToast.error(getErrorMessage(err.payload));
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your username and password to sign in!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General error */}
            {errors.general || error ? (
              <div className="flex items-center justify-center gap-2 text-error-500 text-sm py-2">
                <p>{errors.general || error}</p>
              </div>
            ) : null}

            {/* Username */}
            <div>
              <Label>
                Username {errors.userName && <span className="text-error-500">*</span>}
              </Label>
              <Input
                id="userName"
                name="userName"
                type="text"
                value={formData.userName}
                placeholder="Enter your username"
                onChange={handleChange}
                className={!errors.userName
                  ? `border-l-3 border-l-green-700 dark:border-l-green-500`
                  : `border-l-3 border-l-red-500 dark:border-l-red-500`}
              />
              {errors.userName && <p className="text-error-500 text-sm pt-2">{errors.userName}</p>}
            </div>

            {/* Password */}
            <div>
              <Label>
                Password {errors.password && <span className="text-error-500">*</span>}
              </Label>
              <div className="relative">
                <Input
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={!errors.password
                    ? `border-l-3 border-l-green-700 dark:border-l-green-500`
                    : `border-l-3 border-l-red-500 dark:border-l-red-500`}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
              {errors.password && <p className="text-error-500 text-sm pt-2">{errors.password}</p>}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={isChecked} onChange={setIsChecked} />
                <span className="text-sm text-gray-700 dark:text-gray-400">
                  Keep me logged in
                </span>
              </div>
              <Link
                href="/reset-password"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <div>
              <Button
                type="submit"
                variant="sea"
                loading={status === "loading"}
                loadingPosition="right"
                loadingSpinner="circle"
                hideTextWhenLoading
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Don&apos;t have an account?{" "}
              <Link href="signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
