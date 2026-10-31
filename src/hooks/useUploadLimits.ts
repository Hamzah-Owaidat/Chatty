"use client";
import { useEffect, useState } from "react";
import { getUploadLimits } from "@/lib/api/file";
import { FileUploadLimits } from "@/types/file.models";

// Shared across every component for the whole session — the limits only change with a
// server config change, so one request is enough.
let cached: FileUploadLimits | null = null;
let inFlight: Promise<FileUploadLimits> | null = null;

function loadLimits(): Promise<FileUploadLimits> {
  if (!inFlight) {
    inFlight = getUploadLimits()
      .then((limits) => (cached = limits))
      .catch((err) => {
        inFlight = null; // let the next component retry
        throw err;
      });
  }
  return inFlight;
}

/**
 * The server's upload limits (GET /api/files/limits). Null while loading or if the request
 * failed — callers then skip the size/type pre-checks and leave them to the server.
 */
export function useUploadLimits(): FileUploadLimits | null {
  const [limits, setLimits] = useState<FileUploadLimits | null>(cached);

  useEffect(() => {
    if (cached) return;
    let active = true;

    loadLimits()
      .then((loaded) => active && setLimits(loaded))
      .catch((err) => console.warn("Couldn't load upload limits; relying on server-side checks:", err));

    return () => {
      active = false;
    };
  }, []);

  return limits;
}
