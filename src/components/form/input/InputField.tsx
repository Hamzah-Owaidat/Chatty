import React, { FC } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string; // Optional hint text
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  defaultValue,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
}) => {
  // Determine input styles based on state (disabled, success, error)
  const stateBorderClasses = error
    ? "border-l-[3px] border-l-[#f04438] dark:border-l-[#fda29b]"
    : success
    ? "border-l-[3px] border-l-success-500 dark:border-l-success-400"
    : "";

  const inputClasses = twMerge(
    "w-full rounded-2xl border border-gray-300 bg-white px-4 py-[13px] text-sm text-gray-800 placeholder:text-gray-400 outline-none appearance-none shadow-[inset_0_1px_2px_rgba(16,24,40,.04)] transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] focus:-translate-y-px focus:border-[#1a7b9b] focus:ring-4 focus:ring-[#1a7b9b]/12 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-[#292524] dark:text-white/90 dark:placeholder:text-white/30 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,.3)]",
    stateBorderClasses,
    className
  );

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClasses}
      />

      {/* Optional Hint Text */}
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
