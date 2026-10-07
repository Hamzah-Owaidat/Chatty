'use client';
import Link from "next/link";
import { ArrowLeft, AtSign, Lock, Mail, User as UserIcon } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AvatarUpload from "@/components/common/AvatarUpload";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { uploadProfileImage } from "@/lib/api/user";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { useUploadLimits } from "@/hooks/useUploadLimits";
import { allowedTypes, maxFileSizeLabel } from "@/utils/file";
import { FileKind, FileUploadLimits } from "@/types/file.models";

// "image/jpeg" → "JPEG", for the accepted-formats hint under the avatar.
const imageFormats = (limits: FileUploadLimits) =>
    (allowedTypes(limits, [FileKind.Image]) ?? []).map((t) => t.split("/")[1].toUpperCase()).join(", ");

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

const fieldClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-500 outline-none dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-400 cursor-not-allowed";

export default function ProfilePage() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const token = useAppSelector((state) => state.auth.token);
    const status = useAppSelector((state) => state.auth.status);
    const initialized = useAppSelector((state) => state.auth.initialized);
    const uploadLimits = useUploadLimits();

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
                href="/auth/signin"
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

    const handleImageUpload = async (file: File, onProgress: (percent: number) => void) => {
        try {
            const updated = await uploadProfileImage(file, onProgress);
            dispatch(setCredentials({ user: { ...user, image: updated.image } }));
            showToast.success("Profile picture updated");
        } catch (err) {
            showToast.error(getErrorMessage(err));
        }
    };

    // Only the picture is editable for now — the rest of the form is a static preview.
    const fields = [
        { label: "Display name", value: user.displayName || "", icon: UserIcon },
        { label: "Username", value: user.userName, icon: AtSign },
        { label: "Email", value: user.email || "", icon: Mail },
    ];

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-stone-950">
            <div className="mx-auto max-w-2xl">
                <Link
                    href="/chat"
                    className={`mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 ${EASE} hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
                >
                    <ArrowLeft size={16} />
                    Back to chats
                </Link>

                <div className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04),0_28px_60px_-46px_rgba(16,24,40,.7)] dark:border-stone-800/70 dark:bg-[#201d1b]">
                    <div className="h-28 bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d]" />

                    <div className="px-6 pb-8">
                        <div className="-mt-14 flex flex-col items-center text-center sm:flex-row sm:items-end sm:gap-5 sm:text-left">
                            <div className="rounded-full border-4 border-white dark:border-[#201d1b]">
                                <AvatarUpload
                                    imageUrl={user.image}
                                    fallbackText={user.displayName || user.userName}
                                    onUpload={handleImageUpload}
                                />
                            </div>
                            <div className="mt-3 sm:mb-2">
                                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                                    {user.displayName || user.userName}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-stone-400">@{user.userName}</p>
                            </div>
                        </div>

                        <p className="mt-4 text-center text-xs text-gray-400 sm:text-left dark:text-stone-500">
                            {uploadLimits
                                ? `${imageFormats(uploadLimits)}, up to ${maxFileSizeLabel(uploadLimits)}.`
                                : " "}
                        </p>

                        <div className="mt-8">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-stone-400">
                                    Personal info
                                </h2>
                                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500 dark:bg-white/5 dark:text-stone-400">
                                    <Lock size={11} />
                                    Editing coming soon
                                </span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {fields.map((field) => (
                                    <label key={field.label} className="block">
                                        <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-stone-300">
                                            {field.label}
                                        </span>
                                        <span className="relative block">
                                            <field.icon size={16} className="absolute left-3 top-3 text-gray-400 dark:text-stone-500" />
                                            <input type="text" value={field.value} disabled readOnly className={fieldClass} />
                                        </span>
                                    </label>
                                ))}

                                <label className="block sm:col-span-2">
                                    <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-stone-300">
                                        Bio
                                    </span>
                                    <textarea
                                        disabled
                                        readOnly
                                        rows={3}
                                        placeholder="Tell people a little about yourself"
                                        className="w-full cursor-not-allowed resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 outline-none placeholder-gray-400 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-400 dark:placeholder-stone-500"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    disabled
                                    className="rounded-xl bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] px-5 py-2.5 text-sm font-medium text-white opacity-40"
                                >
                                    Save changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
