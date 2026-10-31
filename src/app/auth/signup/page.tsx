import { Suspense } from "react";
import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chatty SignUp Page",
  description: "This is SignUp Page",
  // other metadata
};

export default function SignUp() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
