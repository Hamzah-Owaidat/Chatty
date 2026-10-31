import InviteLandingPage from "@/components/common/InviteLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chatty Invite",
  description: "You've been invited to chat on Chatty",
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteLandingPage token={token} />;
}
