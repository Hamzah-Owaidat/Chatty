import React from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

export const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

export const ROW_CLASS =
    "rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 dark:border-stone-700 dark:bg-stone-800/60";

export const FIELD_CLASS =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#1a7b9b] focus:ring-4 focus:ring-[#1a7b9b]/12 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-white/90 dark:placeholder:text-stone-500";

export const PRIMARY_BUTTON_CLASS = `rounded-xl bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ${EASE} active:scale-[.985] disabled:pointer-events-none disabled:opacity-50`;

export const SECONDARY_BUTTON_CLASS = `rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 ${EASE} hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-white/5`;

export function SegmentedControl<T extends string>({
    value,
    onChange,
    options,
    disabled = false,
}: {
    value: T;
    onChange: (value: T) => void;
    options: { value: T; label: string }[];
    disabled?: boolean;
}) {
    return (
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-stone-700 dark:bg-stone-800/60">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(opt.value)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${EASE} disabled:opacity-60 ${
                        value === opt.value
                            ? "bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-800 dark:text-stone-400 dark:hover:text-white"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

export function SettingRow({ title, description, control }: { title: string; description: string; control: React.ReactNode }) {
    return (
        <div className={`flex items-center justify-between gap-4 ${ROW_CLASS}`}>
            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-stone-400">{description}</p>
            </div>
            {control}
        </div>
    );
}

/**
 * A settings row that expands in place to reveal a form — keeps the section a flat
 * list instead of opening a modal per action.
 */
export function ExpandableSettingCard({
    icon: Icon,
    title,
    description,
    open,
    onToggle,
    children,
}: {
    icon: LucideIcon;
    title: string;
    description: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className={ROW_CLASS}>
            <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-4 text-left">
                <div className="flex min-w-0 items-center gap-2.5">
                    <Icon size={16} className="shrink-0 text-gray-500 dark:text-stone-400" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-stone-400">{description}</div>
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    className={`shrink-0 text-gray-400 transition-transform duration-200 ${EASE} ${open ? "rotate-180" : ""}`}
                />
            </button>
            {open && <div className="mt-4 border-t border-gray-200 pt-4 dark:border-stone-700">{children}</div>}
        </div>
    );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-stone-300">
            {children}
        </label>
    );
}

export function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">{message}</p>;
}
