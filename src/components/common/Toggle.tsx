interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

/**
 * A controlled on/off switch. The template's src/components/form/switch/Switch.tsx is
 * unused boilerplate (uncontrolled, and styled with a color token this app doesn't
 * otherwise use) — this one follows the app's actual brand-gradient convention instead.
 */
export default function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${EASE} ${
        checked ? "bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d]" : "bg-gray-200 dark:bg-stone-700"
      } disabled:pointer-events-none disabled:opacity-50`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-theme-sm transition-transform duration-200 ${EASE} ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
