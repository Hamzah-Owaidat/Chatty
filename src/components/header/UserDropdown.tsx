"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { User, Settings, LifeBuoy, LogOut, ChevronDown } from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice"; // adjust path if needed
import { useRouter } from "next/navigation";
import LoadingSpinner from "../common/LoadingSpinner";

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";
const menuItemClass =
  "flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium text-gray-700 transition-colors duration-150 hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]";

export default function UserDropdown() {

  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const logoutInProgress = useRef(false);

  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const status = useAppSelector((state) => state.auth.status);
  const initialized = useAppSelector((state) => state.auth.initialized);

  const handleLogout = useCallback(async () => {
    // Prevent multiple simultaneous logout calls
    if (logoutInProgress.current || isLoggingOut) return;

    logoutInProgress.current = true;
    setIsLoggingOut(true);
    setIsOpen(false); // Close dropdown immediately

    try {
      await dispatch(logout()).unwrap();
      // Only redirect after successful logout
      router.replace("/auth/signin"); // Use replace instead of push
    } catch (error) {
      console.error("Logout failed:", error);
      // Handle logout error if needed
    } finally {
      setIsLoggingOut(false);
      logoutInProgress.current = false;
    }
  }, [dispatch, router, isLoggingOut]);

  // Cleanup function to reset ref on unmount
  useEffect(() => {
    return () => {
      logoutInProgress.current = false;
    };
  }, []);

  // Show loading while initializing or fetching user
  if (!initialized || (token && status === 'loading')) {
    return (
      <LoadingSpinner size="sm" text="Loading user..." />
    );
  }

  // Show sign in prompt if no token
  if (!token) {
    return (
      <Link
        href="auth/signin"
        className="px-4 py-2 text-sm font-medium text-[#1a7b9b] hover:text-[#15657d] dark:text-[#60c7e3]"
      >
        Sign In
      </Link>
    );
  }

  // Show loading if token exists but no user data yet
  if (!user) {
    return (
      <LoadingSpinner size="sm" text="Loading user..." />
    );
  }

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className={`dropdown-toggle flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-3 text-gray-700 transition-all duration-200 ${EASE} hover:-translate-y-px hover:border-gray-200/70 hover:bg-white hover:shadow-[0_10px_20px_-14px_rgba(16,24,40,.35)] dark:text-gray-300 dark:hover:border-stone-700/70 dark:hover:bg-[#292524]`}
      >
        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-stone-800">
          <Image
            width={36}
            height={36}
            src="/images/user/owner.jpg"
            alt="User"
            className="h-full w-full object-cover"
          />
        </span>

        <span className="hidden whitespace-nowrap text-theme-sm font-medium sm:block">{user?.userName}</span>

        <ChevronDown
          size={13}
          className={`shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className={`w-[234px] origin-top-right animate-[floatIn_.18s_cubic-bezier(.2,.8,.2,1)_both] rounded-[18px] border border-gray-200/70 bg-white/90 p-1.5 shadow-[0_1px_2px_rgba(16,24,40,.04),0_24px_48px_-24px_rgba(16,24,40,.55)] backdrop-blur-md backdrop-saturate-150 dark:border-stone-800/70 dark:bg-stone-900/90`}
      >
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-stone-800">
            <Image
              width={36}
              height={36}
              src="/images/user/owner.jpg"
              alt="User"
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0">
            <span className="block truncate text-theme-sm font-semibold text-gray-800 dark:text-gray-100">
              {user.userName}
            </span>
            <span className="block truncate text-theme-xs text-gray-500 dark:text-stone-400">
              {user.email}
            </span>
          </div>
        </div>

        <div className="mx-1 border-t border-gray-200/70 dark:border-stone-700/70" />

        <ul className="flex flex-col gap-0.5 py-1.5">
          <li>
            <DropdownItem onItemClick={closeDropdown} tag="a" href="/profile" baseClassName={menuItemClass}>
              <User size={16} className="text-gray-400 dark:text-stone-500" />
              Edit profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem onItemClick={closeDropdown} tag="a" href="/settings" baseClassName={menuItemClass}>
              <Settings size={16} className="text-gray-400 dark:text-stone-500" />
              Account settings
            </DropdownItem>
          </li>
          <li>
            <DropdownItem onItemClick={closeDropdown} tag="a" href="/profile" baseClassName={menuItemClass}>
              <LifeBuoy size={16} className="text-gray-400 dark:text-stone-500" />
              Support
            </DropdownItem>
          </li>
        </ul>

        <div className="mx-1 border-t border-dashed border-gray-300 dark:border-stone-700" />

        <button
          onClick={handleLogout}
          disabled={isLoggingOut || logoutInProgress.current}
          className={`group mt-1.5 flex w-full items-center justify-between rounded-xl border border-error-500/25 bg-gradient-to-r from-error-500/10 to-error-500/5 px-3 py-2.5 text-[13px] font-bold text-error-600 transition-all duration-200 ${EASE} hover:border-transparent hover:bg-[linear-gradient(180deg,#f04438,#d92d20)] hover:text-white hover:shadow-[0_12px_22px_-10px_rgba(240,68,56,.6)] active:scale-[.98] disabled:pointer-events-none disabled:opacity-60 dark:text-error-400`}
        >
          Sign out
          <LogOut size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </Dropdown>
    </div>
  );
}
