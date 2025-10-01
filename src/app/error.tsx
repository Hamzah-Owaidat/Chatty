"use client";

import StatusPage from "@/components/common/StatusPage";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <StatusPage
      code={500}
      title="Server Error"
      message={error.message || "Something went wrong."}
      actionLabel="Try Again"
      actionHref="/chat"
    />
  );
}
