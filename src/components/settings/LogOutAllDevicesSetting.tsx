"use client";
import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { revokeAllSessions } from "@/lib/api/settings";
import { endSession } from "@/lib/auth/session";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { EASE, SECONDARY_BUTTON_CLASS } from "./shared";

export default function LogOutAllDevicesSetting() {
    const [confirming, setConfirming] = useState(false);
    const [revoking, setRevoking] = useState(false);

    const revoke = async () => {
        setRevoking(true);
        try {
            await revokeAllSessions();
            // This device's token is dead too; the hub's SessionRevoked may beat us here,
            // and endSession only runs once either way.
            await endSession("revoked");
        } catch (err) {
            showToast.error(getErrorMessage(err));
            setRevoking(false);
            setConfirming(false);
        }
    };

    return (
        <div className="rounded-2xl border border-error-500/20 bg-error-500/5 px-4 py-3.5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    <LogOut size={16} className="shrink-0 text-error-500" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-error-600 dark:text-error-400">Log out of all devices</p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-stone-400">
                            {confirming
                                ? "Every device, including this one, will have to log in again."
                                : "Signs you out everywhere you're logged in."}
                        </p>
                    </div>
                </div>

                {confirming ? (
                    <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => setConfirming(false)} disabled={revoking} className={SECONDARY_BUTTON_CLASS}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={revoke}
                            disabled={revoking}
                            className={`rounded-xl bg-error-500 px-3.5 py-2.5 text-sm font-medium text-white transition-all duration-200 ${EASE} hover:bg-error-600 disabled:pointer-events-none disabled:opacity-50`}
                        >
                            {revoking ? "Logging out…" : "Log out everywhere"}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className={`shrink-0 rounded-xl border border-error-500/30 px-3.5 py-2.5 text-sm font-medium text-error-600 transition-all duration-200 ${EASE} hover:bg-error-500/10 dark:text-error-400`}
                    >
                        Log out
                    </button>
                )}
            </div>
        </div>
    );
}
