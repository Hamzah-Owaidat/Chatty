'use client';
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAppSelector } from "@/store/hooks";
import { Link } from "lucide-react";

export default function ProfilePage() {
    const user = useAppSelector((state) => state.auth.user);
    const token = useAppSelector((state) => state.auth.token);
    const status = useAppSelector((state) => state.auth.status);
    const initialized = useAppSelector((state) => state.auth.initialized);

    // Show loading while initializing or fetching user
    if (!initialized || (token && status === 'loading')) {
        return (
            <LoadingSpinner size="sm" text="Loading user..." />
        );
    }

    // Show sign in prompt if no token
    if (!token) {
        return (
            <Link
                href="auth/signin"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
                Sign In
            </Link>
        );
    }

    // Show loading if token exists but no user data yet
    if (!user) {
        return (
            <LoadingSpinner size="sm" text="Loading user..." />
        );
    }
    return <div className="p-4">This is the profile page.{user.userName}</div>;
}