"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";

interface StatusPageProps {
  code: number;
  title: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  size?: "sm" | "md" | "lg"; // for flexible usage
}

export default function StatusPage({
  code,
  title,
  message,
  actionLabel = "Go Home",
  actionHref = "/chat",
  size = "lg",
}: StatusPageProps) {
  const sizeClasses = clsx({
    "text-4xl": size === "sm",
    "text-6xl": size === "md",
    "text-8xl": size === "lg",
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className={clsx("font-bold text-primary", sizeClasses)}>{code}</h1>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      {message && <p className="mt-1 text-muted-foreground">{message}</p>}

      <Link
        href={actionHref}
        className="mt-6 rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary/90 transition"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
