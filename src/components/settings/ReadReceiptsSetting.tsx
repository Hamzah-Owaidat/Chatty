"use client";
import React from "react";
import Toggle from "@/components/common/Toggle";
import { updateReadReceipts } from "@/lib/api/settings";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { SettingRow } from "./shared";

export default function ReadReceiptsSetting() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const enabled = user?.readReceiptsEnabled ?? true;

    // Optimistic, like the notification toggles: flip now, roll back on failure.
    const setEnabled = async (value: boolean) => {
        if (!user) return;

        dispatch(setCredentials({ user: { ...user, readReceiptsEnabled: value } }));

        try {
            const saved = await updateReadReceipts(value);
            dispatch(setCredentials({ user: { ...user, readReceiptsEnabled: saved } }));
        } catch (err) {
            dispatch(setCredentials({ user: { ...user, readReceiptsEnabled: enabled } }));
            showToast.error(getErrorMessage(err));
        }
    };

    return (
        <SettingRow
            title="Read receipts"
            description={
                enabled
                    ? "People can see when you've read their messages, and you can see theirs."
                    : "Off: no one sees when you've read their messages, and you don't see when they've read yours."
            }
            control={<Toggle checked={enabled} onChange={setEnabled} label="Read receipts" />}
        />
    );
}
