# Chatty design conventions

## Setup
- Components are presentational and render standalone. No provider is needed to render them.
- Dark mode is class-based. The `dark:` variant applies inside any ancestor with class `dark` (for example `<div class="dark">`).
- Text falls back to the system sans-serif. Do not reference a custom font family.

## Styling: Tailwind v4 utility classes with these named tokens
- Brand: `bg-brand-50`, `bg-brand-100`, `bg-brand-500`, `text-brand-500`, `border-brand-500`. The primary action color is `brand-500`.
- Neutrals: `bg-gray-50`, `bg-gray-100`, `text-gray-700`, `text-gray-900`, `border-gray-200`, `border-gray-300`.
- Status pairs: `bg-success-50` with `text-success-600`, `bg-error-50` with `text-error-600`, `bg-warning-50` with `text-warning-600`, `bg-blue-light-50` with `text-blue-light-500`.
- Type scale: `text-theme-xs` (12px), `text-theme-sm` (14px), `text-theme-xl` (20px).
- Shadows: `shadow-theme-xs`, `shadow-theme-sm`, `shadow-theme-md`, `shadow-theme-lg`.
- Radius: `rounded-lg`, `rounded-xl`, `rounded-full`.
- Scrollbar utilities: `custom-scrollbar`, `no-scrollbar`.

## Where the truth lives
- `styles.css` imports `_ds_bundle.css`, which holds all component styles. Check it before using a class you are unsure of.
- Each component's `.prompt.md` describes its props and usage.

## Build snippet (verified)
```tsx
import { Checkbox, Badge } from 'chatty';

<Checkbox checked={checked} onChange={setChecked} label="Email me updates" />
<Badge variant="solid" color="success">Online</Badge>
```
