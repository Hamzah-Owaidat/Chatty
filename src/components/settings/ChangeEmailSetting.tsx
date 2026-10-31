"use client";
import React, { useState } from "react";
import { Mail } from "lucide-react";
import { changeEmail } from "@/lib/api/settings";
import { emailPattern } from "@/components/auth/shared";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import {
    ExpandableSettingCard,
    FIELD_CLASS,
    FieldError,
    FieldLabel,
    PRIMARY_BUTTON_CLASS,
    SECONDARY_BUTTON_CLASS,
} from "./shared";

type Errors = Partial<Record<"email" | "password", string>>;

export default function ChangeEmailSetting() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const [open, setOpen] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);

    const close = () => {
        setNewEmail("");
        setPassword("");
        setErrors({});
        setOpen(false);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = newEmail.trim();
        const found: Errors = {};
        if (!emailPattern.test(trimmed)) {
            found.email = "Please enter a valid email address";
        } else if (trimmed.toLowerCase() === user?.email?.toLowerCase()) {
            found.email = "This is already your email address";
        }
        if (!password) found.password = "Enter your password to confirm";

        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSaving(true);
        try {
            const updated = await changeEmail(trimmed, password);
            dispatch(setCredentials({ user: updated }));
            showToast.success(`Confirmation link sent to ${updated.pendingEmail ?? trimmed}`);
            close();
        } catch (err) {
            const message = getErrorMessage(err);
            if (/password/i.test(message)) {
                setErrors({ password: message });
            } else if (/email/i.test(message)) {
                setErrors({ email: message });
            } else {
                showToast.error(message);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <ExpandableSettingCard
            icon={Mail}
            title="Change email"
            description={
                <>
                    <span>{user?.email}</span>
                    {user?.pendingEmail && (
                        <span className="mt-1 block text-warning-600 dark:text-warning-400">
                            Waiting for confirmation of {user.pendingEmail}. Check that inbox for the link.
                        </span>
                    )}
                </>
            }
            open={open}
            onToggle={() => (open ? close() : setOpen(true))}
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                <p className="text-xs text-gray-500 dark:text-stone-400">
                    We&apos;ll send a confirmation link to the new address. Your current email keeps working until you click it.
                </p>
                <div>
                    <FieldLabel htmlFor="new-email">New email</FieldLabel>
                    <input
                        id="new-email"
                        type="email"
                        autoComplete="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className={FIELD_CLASS}
                        disabled={saving}
                    />
                    <FieldError message={errors.email} />
                </div>
                <div>
                    <FieldLabel htmlFor="email-password">Password</FieldLabel>
                    <input
                        id="email-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={FIELD_CLASS}
                        disabled={saving}
                    />
                    <FieldError message={errors.password} />
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={close} disabled={saving} className={SECONDARY_BUTTON_CLASS}>
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className={PRIMARY_BUTTON_CLASS}>
                        {saving ? "Sending…" : "Send confirmation link"}
                    </button>
                </div>
            </form>
        </ExpandableSettingCard>
    );
}
