"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface RouteGuardProps {
  children: ReactNode;
}

/**
 * Global route guard.
 * - If user has no token, redirects to /auth/signin.
 * - Auth routes (/auth/...) remain publicly accessible.
 */
export default function RouteGuard({ children }: RouteGuardProps) {
  const { token, initialized } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthRoute = pathname?.startsWith("/auth");

  useEffect(() => {
    if (!mounted || !initialized) return;

    // If not on an auth route and no token, redirect to signin
    if (!isAuthRoute && !token) {
      router.replace("/auth/signin");
    }
  }, [mounted, initialized, isAuthRoute, token, router]);

  // While initializing or before mount, show a loader
  if (!mounted || !initialized) {
    return <LoadingSpinner size="xl" fullScreen text="Loading..." />;
  }

  // While redirecting away from protected routes, render nothing
  if (!isAuthRoute && !token) {
    return null;
  }

  return <>{children}</>;
}

