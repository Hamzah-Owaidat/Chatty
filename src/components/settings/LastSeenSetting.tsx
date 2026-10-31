"use client";
import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import UserAvatar from "@/components/common/UserAvatar";
import {
    addLastSeenContact,
    getLastSeenPrivacy,
    removeLastSeenContact,
    updateLastSeenVisibility,
} from "@/lib/api/settings";
import { searchUsers } from "@/lib/api/user";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { ChatParticipant } from "@/types/chat/chat.models";
import { LastSeenPrivacy, LastSeenVisibility } from "@/types/user";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { FIELD_CLASS, ROW_CLASS, SegmentedControl } from "./shared";

const DESCRIPTIONS: Record<LastSeenVisibility, string> = {
    everyone: "Anyone can see when you're online and when you were last seen.",
    contacts: "Only the people you add below can see it. Everyone else sees you as offline.",
    nobody: "No one can see it. Everyone sees you as offline.",
};

export default function LastSeenSetting() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const [privacy, setPrivacy] = useState<LastSeenPrivacy | null>(null);
    const [saving, setSaving] = useState(false);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ChatParticipant[]>([]);
    const [searching, setSearching] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        getLastSeenPrivacy()
            .then(setPrivacy)
            .catch((err) => showToast.error(getErrorMessage(err)));
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);

        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                setResults(await searchUsers(trimmed));
            } catch (err) {
                showToast.error(getErrorMessage(err));
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    // Keeps /user/me in the store in sync, so other screens see the new setting.
    const apply = (next: LastSeenPrivacy) => {
        setPrivacy(next);
        if (user && user.lastSeenVisibility !== next.value) {
            dispatch(setCredentials({ user: { ...user, lastSeenVisibility: next.value } }));
        }
    };

    const changeVisibility = async (value: LastSeenVisibility) => {
        if (!privacy || value === privacy.value) return;
        setSaving(true);
        try {
            apply(await updateLastSeenVisibility(value));
        } catch (err) {
            showToast.error(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const addContact = async (contact: ChatParticipant) => {
        setBusyId(contact.id);
        try {
            apply(await addLastSeenContact(contact.id));
            setQuery("");
        } catch (err) {
            showToast.error(getErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    const removeContact = async (contactId: string) => {
        setBusyId(contactId);
        try {
            apply(await removeLastSeenContact(contactId));
        } catch (err) {
            showToast.error(getErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    if (!privacy) {
        return (
            <div className={ROW_CLASS}>
                <p className="text-sm text-gray-500 dark:text-stone-400">Loading last seen settings…</p>
            </div>
        );
    }

    const listedIds = new Set(privacy.contacts.map((c) => c.id));
    const addable = results.filter((r) => !listedIds.has(r.id));

    return (
        <div className={`space-y-4 ${ROW_CLASS}`}>
            <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Last seen & online</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-stone-400">{DESCRIPTIONS[privacy.value]}</p>
            </div>

            <SegmentedControl
                value={privacy.value}
                onChange={changeVisibility}
                disabled={saving}
                options={[
                    { value: "everyone", label: "Everyone" },
                    { value: "contacts", label: "Selected people" },
                    { value: "nobody", label: "Nobody" },
                ]}
            />

            {privacy.value === "contacts" && (
                <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-stone-700">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search people to add"
                            className={`${FIELD_CLASS} pl-10`}
                        />
                        <Search size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-stone-500" />
                    </div>

                    {query.trim().length >= 2 && (
                        <div className="rounded-xl border border-gray-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-900">
                            {searching ? (
                                <p className="px-3 py-3 text-sm text-gray-500 dark:text-stone-400">Searching…</p>
                            ) : addable.length === 0 ? (
                                <p className="px-3 py-3 text-sm text-gray-500 dark:text-stone-400">No one new to add.</p>
                            ) : (
                                <ul>
                                    {addable.map((result) => (
                                        <li key={result.id}>
                                            <button
                                                type="button"
                                                onClick={() => addContact(result)}
                                                disabled={busyId === result.id}
                                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-white/5"
                                            >
                                                <UserAvatar src={result.image} name={result.displayName} size={32} />
                                                <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {result.displayName}
                                                </span>
                                                <span className="text-xs font-medium text-accent-600 dark:text-accent-300">Add</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {privacy.contacts.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-stone-400">
                            No one added yet — until you add someone, nobody can see your last seen.
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {privacy.contacts.map((contact) => (
                                <li key={contact.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                                    <UserAvatar src={contact.image} name={contact.displayName} size={32} />
                                    <span className="flex-1 truncate text-sm text-gray-800 dark:text-white/90">{contact.displayName}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeContact(contact.id)}
                                        disabled={busyId === contact.id}
                                        aria-label={`Remove ${contact.displayName}`}
                                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-500/10 hover:text-error-600 disabled:opacity-50 dark:text-stone-500 dark:hover:text-error-400"
                                    >
                                        <X size={15} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
