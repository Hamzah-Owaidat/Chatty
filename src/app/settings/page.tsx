'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Bell,
    Eye,
    HardDrive,
    Lock,
    LogOut,
    LucideIcon,
    MessageSquare,
    Palette,
    Shield,
    Trash2,
    UserX,
    Volume2,
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toggle from "@/components/common/Toggle";
import { useAppSelector } from "@/store/hooks";
import { useTheme } from "@/context/ThemeContext";
import { usePreferences } from "@/context/PreferencesContext";
import { clearAllCachedMedia, getCacheStats } from "@/lib/media/mediaCache";
import { formatFileSize } from "@/utils/file";
import { showToast } from "@/utils/toast";
import { EASE, SegmentedControl, SettingRow } from "@/components/settings/shared";
import ChangePasswordSetting from "@/components/settings/ChangePasswordSetting";
import ChangeEmailSetting from "@/components/settings/ChangeEmailSetting";
import LastSeenSetting from "@/components/settings/LastSeenSetting";
import NotificationSettings from "@/components/settings/NotificationSettings";

type SectionId = "appearance" | "chat" | "storage" | "security" | "privacy" | "notifications" | "danger";

interface SectionDef {
    id: SectionId;
    label: string;
    description: string;
    icon: LucideIcon;
    danger?: boolean;
}

// New sections (future tickets) just get added here — nav, select, and layout all follow.
const SECTIONS: SectionDef[] = [
    { id: "appearance", label: "Appearance", description: "Customize how Chatty looks on this device.", icon: Palette },
    { id: "chat", label: "Chat", description: "Control how the message composer and media behave.", icon: MessageSquare },
    { id: "storage", label: "Storage", description: "Manage media cached on this device.", icon: HardDrive },
    { id: "security", label: "Account & security", description: "Manage your password, email, and active sessions.", icon: Shield },
    { id: "privacy", label: "Privacy", description: "Control what other people can see about you.", icon: Eye },
    { id: "notifications", label: "Notifications", description: "Choose what notifies you, and how.", icon: Bell },
    { id: "danger", label: "Danger zone", description: "Irreversible actions — proceed with caution.", icon: Trash2, danger: true },
];

const comingSoonPill = (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500 dark:bg-white/5 dark:text-stone-400">
        <Lock size={11} />
        Coming soon
    </span>
);

function SectionHeader({ section }: { section: SectionDef }) {
    return (
        <div className="mb-6">
            <h2 className={`text-lg font-semibold ${section.danger ? "text-error-600 dark:text-error-400" : "text-gray-800 dark:text-white/90"}`}>
                {section.label}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">{section.description}</p>
        </div>
    );
}

function PlaceholderRows({ rows }: { rows: { icon: LucideIcon; label: string }[] }) {
    return (
        <div className="space-y-2">
            {rows.map((row) => (
                <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200/70 bg-gray-50/60 px-4 py-3.5 opacity-60 dark:border-stone-800 dark:bg-stone-800/30"
                >
                    <div className="flex items-center gap-2.5">
                        <row.icon size={16} className="text-gray-400 dark:text-stone-500" />
                        <span className="text-sm font-medium text-gray-600 dark:text-stone-300">{row.label}</span>
                    </div>
                    {comingSoonPill}
                </div>
            ))}
        </div>
    );
}

function DangerRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-error-500/20 bg-error-500/5 px-4 py-3.5 opacity-70">
            <div className="flex items-center gap-2.5">
                <Icon size={16} className="text-error-500" />
                <span className="text-sm font-medium text-error-600 dark:text-error-400">{label}</span>
            </div>
            {comingSoonPill}
        </div>
    );
}

export default function SettingsPage() {
    const user = useAppSelector((state) => state.auth.user);
    const token = useAppSelector((state) => state.auth.token);
    const status = useAppSelector((state) => state.auth.status);
    const initialized = useAppSelector((state) => state.auth.initialized);
    const { theme, setTheme } = useTheme();
    const { preferences, setPreference } = usePreferences();

    const [activeSection, setActiveSection] = useState<SectionId>("appearance");
    const [cacheStats, setCacheStats] = useState<{ count: number; totalBytes: number } | null>(null);
    const [clearingCache, setClearingCache] = useState(false);

    useEffect(() => {
        getCacheStats().then(setCacheStats);
    }, []);

    const handleClearCache = async () => {
        setClearingCache(true);
        try {
            await clearAllCachedMedia();
            setCacheStats({ count: 0, totalBytes: 0 });
            showToast.success("Cache cleared");
        } catch {
            showToast.error("Couldn't clear the cache — try again.");
        } finally {
            setClearingCache(false);
        }
    };

    if (!initialized || (token && status === 'loading')) {
        return <LoadingSpinner size="sm" text="Loading user..." />;
    }

    if (!token) {
        return (
            <Link href="/auth/signin" className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                Sign In
            </Link>
        );
    }

    if (!user) {
        return <LoadingSpinner size="sm" text="Loading user..." />;
    }

    const section = SECTIONS.find((s) => s.id === activeSection)!;

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-stone-950">
            <div className="mx-auto max-w-4xl">
                <Link
                    href="/chat"
                    className={`mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 ${EASE} hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
                >
                    <ArrowLeft size={16} />
                    Back to chats
                </Link>

                <h1 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white/90">Account settings</h1>

                <div className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04),0_28px_60px_-46px_rgba(16,24,40,.7)] dark:border-stone-800/70 dark:bg-[#201d1b]">
                    <div className="flex flex-col md:flex-row">
                        {/* Section nav — a top select below md (no squeezed sidebar on narrow
                            screens), a sticky vertical list from md up. */}
                        <div className="shrink-0 border-b border-gray-100 p-4 dark:border-stone-800 md:w-60 md:border-b-0 md:border-r md:p-5">
                            <label htmlFor="settings-section" className="sr-only">
                                Settings section
                            </label>
                            <select
                                id="settings-section"
                                value={activeSection}
                                onChange={(e) => setActiveSection(e.target.value as SectionId)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm font-medium text-gray-800 outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white md:hidden"
                            >
                                {SECTIONS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>

                            <nav className="hidden md:sticky md:top-8 md:block md:space-y-1">
                                {SECTIONS.map((s) => {
                                    const isActive = s.id === activeSection;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setActiveSection(s.id)}
                                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-200 ${EASE} ${
                                                isActive
                                                    ? s.danger
                                                        ? "bg-error-500/10 text-error-600 dark:text-error-400"
                                                        : "bg-gradient-to-r from-[#1a7b9b]/[0.12] to-transparent text-[#1a7b9b] dark:from-[#2596bb]/[0.18] dark:text-[#60c7e3]"
                                                    : s.danger
                                                      ? "text-error-500/80 hover:bg-error-500/5 hover:text-error-600 dark:hover:text-error-400"
                                                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-800 dark:text-stone-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
                                            }`}
                                        >
                                            <s.icon size={16} />
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 p-6 sm:p-8">
                            <SectionHeader section={section} />

                            {activeSection === "appearance" && (
                                <div className="space-y-5">
                                    <div>
                                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-stone-300">Theme</span>
                                        <SegmentedControl
                                            value={theme}
                                            onChange={setTheme}
                                            options={[
                                                { value: "light", label: "Light" },
                                                { value: "dark", label: "Dark" },
                                                { value: "system", label: "System" },
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-stone-300">
                                            Message density
                                        </span>
                                        <SegmentedControl
                                            value={preferences.messageDensity}
                                            onChange={(value) => setPreference("messageDensity", value)}
                                            options={[
                                                { value: "comfortable", label: "Comfortable" },
                                                { value: "compact", label: "Compact" },
                                            ]}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeSection === "chat" && (
                                <div className="space-y-3">
                                    <SettingRow
                                        title="Send with Enter"
                                        description={
                                            preferences.sendOnEnter
                                                ? "Press Enter to send. Turn this off to use Ctrl+Enter instead."
                                                : "Press Ctrl+Enter (or Cmd+Enter) to send."
                                        }
                                        control={
                                            <Toggle
                                                checked={preferences.sendOnEnter}
                                                onChange={(value) => setPreference("sendOnEnter", value)}
                                                label="Send with Enter"
                                            />
                                        }
                                    />
                                    <SettingRow
                                        title="Auto-download photos & videos"
                                        description="Audio and documents always stay tap-to-download, regardless of this setting."
                                        control={
                                            <Toggle
                                                checked={preferences.autoDownloadMedia}
                                                onChange={(value) => setPreference("autoDownloadMedia", value)}
                                                label="Auto-download photos & videos"
                                            />
                                        }
                                    />
                                </div>
                            )}

                            {activeSection === "storage" && (
                                <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 dark:border-stone-700 dark:bg-stone-800/60">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            {cacheStats
                                                ? `${cacheStats.count} file${cacheStats.count === 1 ? "" : "s"} · ${formatFileSize(cacheStats.totalBytes)}`
                                                : "Calculating…"}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-500 dark:text-stone-400">
                                            Media downloaded in chats, cached on this device.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearCache}
                                        disabled={clearingCache || !cacheStats?.count}
                                        className={`shrink-0 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 ${EASE} hover:border-error-300 hover:bg-error-500/10 hover:text-error-600 disabled:pointer-events-none disabled:opacity-40 dark:border-stone-700 dark:text-stone-300 dark:hover:border-error-500/40 dark:hover:bg-error-500/10 dark:hover:text-error-400`}
                                    >
                                        {clearingCache ? "Clearing…" : "Clear cache"}
                                    </button>
                                </div>
                            )}

                            {activeSection === "security" && (
                                <div className="space-y-3">
                                    <ChangePasswordSetting />
                                    <ChangeEmailSetting />
                                    <PlaceholderRows rows={[{ icon: Shield, label: "Active sessions" }]} />
                                </div>
                            )}

                            {activeSection === "privacy" && (
                                <div className="space-y-3">
                                    <LastSeenSetting />
                                    <PlaceholderRows
                                        rows={[
                                            { icon: Shield, label: "Read receipts" },
                                            { icon: UserX, label: "Blocked users" },
                                        ]}
                                    />
                                </div>
                            )}

                            {activeSection === "notifications" && (
                                <div className="space-y-3">
                                    <NotificationSettings />
                                    <PlaceholderRows rows={[{ icon: Volume2, label: "Notification sound" }]} />
                                </div>
                            )}

                            {activeSection === "danger" && (
                                <div className="space-y-2">
                                    <DangerRow icon={LogOut} label="Log out of all devices" />
                                    <DangerRow icon={Trash2} label="Delete account" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
