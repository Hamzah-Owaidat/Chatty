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
 * - Auth routes (/auth/...) and the landing page (/) remain publicly accessible.
 * - Invite links (/invite/...) remain publicly accessible too, so an unauthenticated
 *   visitor can see who invited them before being sent to sign in/up.
 */
export default function RouteGuard({ children }: RouteGuardProps) {
  const { token, initialized } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicRoute = pathname === "/" || pathname?.startsWith("/auth") || pathname?.startsWith("/invite");

  useEffect(() => {
    if (!mounted || !initialized) return;

    // If not on a public route and no token, redirect to signin
    if (!isPublicRoute && !token) {
      router.replace("/auth/signin");
    }
  }, [mounted, initialized, isPublicRoute, token, router]);

  // While initializing or before mount, show a loader
  if (!mounted || !initialized) {
    return <LoadingSpinner size="xl" fullScreen text="Loading..." />;
  }

  // While redirecting away from protected routes, render nothing
  if (!isPublicRoute && !token) {
    return null;
  }

  return <>{children}</>;
}

