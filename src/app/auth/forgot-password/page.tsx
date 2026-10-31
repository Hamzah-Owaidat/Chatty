import { Suspense } from "react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chatty Forgot Password",
  description: "Request a password reset link for your Chatty account",
};

export default function ForgotPassword() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
