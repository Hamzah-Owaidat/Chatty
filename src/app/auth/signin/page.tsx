import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chatty SignIn Page",
  description: "This is Signin Page",
};

export default function SignIn() {
  return <SignInForm />;
}
