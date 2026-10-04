"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getInviteInfo, acceptInvite } from "@/lib/api/invite";
import { getSavedToken } from "@/utils/authToken";
import { getErrorMessage } from "@/utils/error";
import { ChatInviteInfo } from "@/types/chat/chat.models";
import ThemeResponsiveLogo from "@/components/common/ThemeResponsiveLogo";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import UserAvatar from "@/components/common/UserAvatar";

type Status = "loading" | "preview" | "error";

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

export default function InviteLandingPage({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [info, setInfo] = useState<ChatInviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  // Accepting has a side effect (creates a chat) — guard against firing it twice,
  // e.g. React Strict Mode's dev-mode double-invoke of effects.
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const run = async () => {
      // Already signed in — accept immediately and land straight in the chat.
      // The backend handles both validation rules: rejects the sender's own link,
      // and reuses the existing chat if these two users already have one.
      if (getSavedToken()) {
        try {
          const chat = await acceptInvite(token);
          router.replace(`/chat?chatId=${chat.id}`);
        } catch (err) {
          setErrorMsg(getErrorMessage(err));
          setStatus("error");
        }
        return;
      }

      // Not signed in — show who invited them, then send them to sign in/up and
      // back here afterward to actually accept.
      try {
        const inviteInfo = await getInviteInfo(token);
        setInfo(inviteInfo);
        setStatus("preview");
      } catch (err) {
        setErrorMsg(getErrorMessage(err));
        setStatus("error");
      }
    };

    run();
    // token is fixed for this page's lifetime — nothing else here should re-trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "loading") {
    return <LoadingSpinner size="xl" fullScreen text="Opening your invite..." />;
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-stone-900">
        <ThemeResponsiveLogo className="h-8 w-auto" />
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          This invite link isn&apos;t valid
        </h1>
        <p className="max-w-sm text-sm text-gray-500 dark:text-stone-400">{errorMsg}</p>
        <Link href="/chat" className="text-sm text-[#1a7b9b] hover:text-[#15657d] dark:text-[#60c7e3]">
          Go to Chatty
        </Link>
      </div>
    );
  }

  const redirectTarget = `/invite/${token}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center dark:bg-stone-900">
      <ThemeResponsiveLogo className="h-8 w-auto" />

      <div className="flex flex-col items-center gap-3">
        <UserAvatar src={info?.senderImage} name={info?.senderDisplayName || "Chatty user"} size={72} />
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {info?.senderDisplayName} invited you to chat
        </h1>
        <p className="max-w-sm text-sm text-gray-500 dark:text-stone-400">
          Sign in or create a Chatty account to start chatting with {info?.senderDisplayName}.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href={`/auth/signin?redirect=${encodeURIComponent(redirectTarget)}`}
          className={`flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] py-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_16px_30px_-16px_rgba(26,123,155,.75)] transition-all duration-200 ${EASE} hover:-translate-y-px`}
        >
          <MessageCircle size={16} />
          Sign in
        </Link>
        <Link
          href={`/auth/signup?redirect=${encodeURIComponent(redirectTarget)}`}
          className={`flex items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-all duration-200 ${EASE} hover:-translate-y-px dark:border-stone-700 dark:text-white/90`}
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
