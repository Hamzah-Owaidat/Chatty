"use client";
import React, { useEffect, useState } from "react";

interface UserAvatarProps {
  // The user's (or group's) image URL — falls back to their initial when missing or broken.
  src?: string | null;
  name?: string | null;
  // Pixel size (width = height).
  size?: number;
  // Overrides the shape/extra styling (defaults to a circle).
  className?: string;
}

/**
 * The one avatar used across the app: the real uploaded picture when there is one,
 * otherwise the name's initial on the brand gradient. A plain <img> on purpose —
 * next/image rejects hosts not listed in next.config, and older accounts may carry an
 * image URL from anywhere.
 */
export default function UserAvatar({ src, name, size = 40, className = "rounded-full" }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  // A new URL (e.g. after an upload) deserves a fresh attempt.
  useEffect(() => setFailed(false), [src]);

  const initial = (name?.trim().charAt(0) || "?").toUpperCase();
  const showImage = !!src && !failed;

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] font-semibold text-white ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.4)) }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- see component doc
        <img
          src={src!}
          alt={name || "Avatar"}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
}
