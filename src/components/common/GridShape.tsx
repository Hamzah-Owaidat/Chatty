import React from "react";

export default function GridShape() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 dark:opacity-30"
      style={{
        backgroundImage:
          "linear-gradient(#e0e4ea 1px, transparent 1px), linear-gradient(90deg, #e0e4ea 1px, transparent 1px)",
        backgroundSize: "30px 30px",
        maskImage: "radial-gradient(60% 55% at 50% 45%, #000, transparent)",
        WebkitMaskImage: "radial-gradient(60% 55% at 50% 45%, #000, transparent)",
      }}
    />
  );
}
