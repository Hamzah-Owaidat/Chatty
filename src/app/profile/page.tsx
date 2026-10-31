'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme } from "emoji-picker-react";
import { ArrowLeft, AtSign, Mail, Smile, User as UserIcon } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AvatarUpload from "@/components/common/AvatarUpload";
import BackgroundImageUpload from "@/components/common/BackgroundImageUpload";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { updateBio, updateDisplayName, uploadBackgroundImage, uploadProfileImage } from "@/lib/api/user";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { getDisplayNameCooldown } from "@/utils/time";
import { useTheme } from "@/context/ThemeContext";

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";
const BIO_MAX_LENGTH = 160;

const disabledFieldClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-500 outline-none dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-400 cursor-not-allowed";

const activeFieldClass =
    `w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500`;

const activeTextareaClass =
    `w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500`;

export default function ProfilePage() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const token = useAppSelector((state) => state.auth.token);
    const status = useAppSelector((state) => state.auth.status);
    const initialized = useAppSelector((state) => state.auth.initialized);
    const { theme } = useTheme();

    const [displayNameDraft, setDisplayNameDraft] = useState(user?.displayName || "");
    const [bioDraft, setBioDraft] = useState(user?.bio || "");
    const [saving, setSaving] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Re-seed the drafts only when the signed-in user itself changes (e.g. first load) —
    // not on every store update, so an in-progress edit of one field survives an unrelated
    // instant upload (avatar/background) dispatching its own setCredentials.
    useEffect(() => {
        setDisplayNameDraft(user?.displayName || "");
        setBioDraft(user?.bio || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    useEffect(() => {
        if (!showEmojiPicker) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiPicker]);

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

    const cooldown = getDisplayNameCooldown(user.displayNameUpdatedAt);

    const handleImageUpload = async (file: File, onProgress: (percent: number) => void) => {
        try {
            const updated = await uploadProfileImage(file, onProgress);
            dispatch(setCredentials({ user: { ...user, image: updated.image } }));
            showToast.success("Profile picture updated");
        } catch (err) {
            showToast.error(getErrorMessage(err));
        }
    };

    const handleBackgroundUpload = async (file: File, onProgress: (percent: number) => void) => {
        try {
            const updated = await uploadBackgroundImage(file, onProgress);
            dispatch(setCredentials({ user: { ...user, backgroundImage: updated.backgroundImage } }));
            showToast.success("Background image updated");
        } catch (err) {
            showToast.error(getErrorMessage(err));
        }
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setBioDraft((prev) => (prev + emojiData.emoji).slice(0, BIO_MAX_LENGTH));
    };

    const trimmedNameDraft = displayNameDraft.trim();
    const nameChanged = trimmedNameDraft !== (user.displayName || "");
    const bioChanged = bioDraft !== (user.bio || "");
    const dirty = (nameChanged && cooldown.canChange) || bioChanged;

    const handleSave = async () => {
        if (!dirty || saving) return;

        setSaving(true);
        const [nameResult, bioResult] = await Promise.allSettled([
            nameChanged && cooldown.canChange ? updateDisplayName(trimmedNameDraft) : Promise.resolve(null),
            bioChanged ? updateBio(bioDraft) : Promise.resolve(null),
        ]);
        setSaving(false);

        let merged = user;
        let anySuccess = false;

        if (nameChanged && cooldown.canChange) {
            if (nameResult.status === "fulfilled" && nameResult.value) {
                merged = { ...merged, displayName: nameResult.value.displayName, displayNameUpdatedAt: nameResult.value.displayNameUpdatedAt };
                anySuccess = true;
            } else if (nameResult.status === "rejected") {
                showToast.error(getErrorMessage(nameResult.reason));
            }
        }

        if (bioChanged) {
            if (bioResult.status === "fulfilled" && bioResult.value) {
                merged = { ...merged, bio: bioResult.value.bio };
                anySuccess = true;
            } else if (bioResult.status === "rejected") {
                showToast.error(getErrorMessage(bioResult.reason));
            }
        }

        if (anySuccess) {
            dispatch(setCredentials({ user: merged }));
            showToast.success("Profile updated");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-stone-950">
            <div className="mx-auto max-w-2xl">
                <Link
                    href="/chat"
                    className={`mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 ${EASE} hover:bg-accent-600/10 hover:text-accent-600 dark:text-stone-300 dark:hover:bg-accent-400/15 dark:hover:text-accent-300`}
                >
                    <ArrowLeft size={16} />
                    Back to chats
                </Link>

                <div className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04),0_28px_60px_-46px_rgba(16,24,40,.7)] dark:border-stone-800/70 dark:bg-[#201d1b]">
                    <BackgroundImageUpload imageUrl={user.backgroundImage} onUpload={handleBackgroundUpload} />

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
                            Any image — automatically optimized to WebP, up to 2 MB.
                        </p>

                        <div className="mt-8">
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-stone-400">
                                Personal info
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-stone-300">
                                        Display name <span className="font-normal normal-case text-gray-400 dark:text-stone-500">(editable every 30 days)</span>
                                    </span>
                                    <span className="relative block">
                                        <UserIcon size={16} className="absolute left-3 top-3 text-gray-400 dark:text-stone-500" />
                                        <input
                                            type="text"
                                            value={displayNameDraft}
                                            onChange={(e) => setDisplayNameDraft(e.target.value)}
                                            disabled={!cooldown.canChange || saving}
                                            readOnly={!cooldown.canChange}
                                            maxLength={50}
                                            placeholder="Your name"
                                            className={cooldown.canChange ? activeFieldClass : disabledFieldClass}
                                        />
                                    </span>
                                    {!cooldown.canChange && cooldown.nextEligibleAt && (
                                        <span className="mt-1.5 block text-xs text-gray-400 dark:text-stone-500">
                                            You can change this again on {cooldown.nextEligibleAt.toLocaleDateString()} ({cooldown.daysRemaining}d left)
                                        </span>
                                    )}
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-stone-300">
                                        Username
                                    </span>
                                    <span className="relative block">
                                        <AtSign size={16} className="absolute left-3 top-3 text-gray-400 dark:text-stone-500" />
                                        <input type="text" value={user.userName} disabled readOnly className={disabledFieldClass} />
                                    </span>
                                </label>

                                <label className="block sm:col-span-2">
                                    <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-stone-300">
                                        Email
                                    </span>
                                    <span className="relative block">
                                        <Mail size={16} className="absolute left-3 top-3 text-gray-400 dark:text-stone-500" />
                                        <input type="text" value={user.email || ""} disabled readOnly className={disabledFieldClass} />
                                    </span>
                                </label>

                                <label className="block sm:col-span-2">
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-600 dark:text-stone-300">Bio</span>
                                        <div className="flex items-center gap-2">
                                            <div className="relative" ref={emojiPickerRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                                                    aria-label="Choose emoji"
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-all duration-200 ${EASE} hover:scale-110 hover:bg-accent-600/10 hover:text-accent-600 dark:text-stone-500 dark:hover:bg-accent-400/15 dark:hover:text-accent-300`}
                                                >
                                                    <Smile className="h-4 w-4" />
                                                </button>
                                                {showEmojiPicker && (
                                                    <div className="absolute right-0 top-full z-40 mt-2">
                                                        <EmojiPicker
                                                            onEmojiClick={handleEmojiClick}
                                                            theme={theme === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                                                            lazyLoadEmojis
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-gray-400 dark:text-stone-500">
                                                {bioDraft.length}/{BIO_MAX_LENGTH}
                                            </span>
                                        </div>
                                    </div>
                                    <textarea
                                        value={bioDraft}
                                        onChange={(e) => setBioDraft(e.target.value.slice(0, BIO_MAX_LENGTH))}
                                        disabled={saving}
                                        rows={3}
                                        maxLength={BIO_MAX_LENGTH}
                                        placeholder="Tell people a little about yourself"
                                        className={activeTextareaClass}
                                    />
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!dirty || saving}
                                    className={`rounded-xl bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 ${EASE} hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40`}
                                >
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
