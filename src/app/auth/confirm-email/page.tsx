import { Suspense } from "react";
import ConfirmEmailForm from "@/components/auth/ConfirmEmailForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chatty Confirm Email",
  description: "Confirm your Chatty account email address",
};

export default function ConfirmEmail() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailForm />
    </Suspense>
  );
}
