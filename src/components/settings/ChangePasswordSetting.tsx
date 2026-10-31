"use client";
import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { changePassword } from "@/lib/api/settings";
import { PasswordStrengthMeter, passwordPattern } from "@/components/auth/shared";
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

type Errors = Partial<Record<"current" | "next" | "confirm", string>>;

export default function ChangePasswordSetting() {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);

    const reset = () => {
        setCurrent("");
        setNext("");
        setConfirm("");
        setErrors({});
    };

    const close = () => {
        reset();
        setOpen(false);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        const found: Errors = {};
        if (!current) found.current = "Enter your current password";
        if (!passwordPattern.test(next)) {
            found.next = "At least 8 characters, with an uppercase letter and a digit";
        } else if (next === current) {
            found.next = "Your new password must be different from your current one";
        }
        if (confirm !== next) found.confirm = "Passwords do not match";

        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSaving(true);
        try {
            const message = await changePassword(current, next);
            showToast.success(message);
            close();
        } catch (err) {
            const message = getErrorMessage(err);
            // The only field-specific server error; everything else (429, etc.) is a toast.
            if (/current password/i.test(message)) {
                setErrors({ current: message });
            } else {
                showToast.error(message);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <ExpandableSettingCard
            icon={KeyRound}
            title="Change password"
            description="Use a password you don't use anywhere else."
            open={open}
            onToggle={() => (open ? close() : setOpen(true))}
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                    <FieldLabel htmlFor="current-password">Current password</FieldLabel>
                    <input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        className={FIELD_CLASS}
                        disabled={saving}
                    />
                    <FieldError message={errors.current} />
                </div>
                <div>
                    <FieldLabel htmlFor="new-password">New password</FieldLabel>
                    <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                        className={FIELD_CLASS}
                        disabled={saving}
                    />
                    <PasswordStrengthMeter password={next} />
                    <FieldError message={errors.next} />
                </div>
                <div>
                    <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
                    <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className={FIELD_CLASS}
                        disabled={saving}
                    />
                    <FieldError message={errors.confirm} />
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={close} disabled={saving} className={SECONDARY_BUTTON_CLASS}>
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className={PRIMARY_BUTTON_CLASS}>
                        {saving ? "Saving…" : "Update password"}
                    </button>
                </div>
            </form>
        </ExpandableSettingCard>
    );
}
