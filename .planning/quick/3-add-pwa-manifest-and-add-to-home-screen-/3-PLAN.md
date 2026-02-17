---
phase: quick
plan: 3
type: execute
wave: 1
depends_on: []
files_modified:
  - public/manifest.json
  - public/icons/icon-192.png
  - public/icons/icon-512.png
  - public/icons/apple-touch-icon.png
  - src/app/layout.tsx
autonomous: true

must_haves:
  truths:
    - "Browser prompts 'Add to Home Screen' on Android Chrome"
    - "iOS Safari shows the app name and icon when saved to home screen"
    - "App launches in standalone mode (no browser chrome) when opened from home screen"
    - "App has a themed status bar color on mobile"
  artifacts:
    - path: "public/manifest.json"
      provides: "PWA manifest with name, icons, display mode, theme color"
      contains: "standalone"
    - path: "public/icons/icon-192.png"
      provides: "192x192 icon required by Android"
    - path: "public/icons/icon-512.png"
      provides: "512x512 icon required by Android"
    - path: "public/icons/apple-touch-icon.png"
      provides: "180x180 icon required by iOS"
    - path: "src/app/layout.tsx"
      provides: "manifest link, apple meta tags, theme-color in <head>"
      contains: "manifest"
  key_links:
    - from: "src/app/layout.tsx"
      to: "public/manifest.json"
      via: "Next.js metadata.manifest field"
      pattern: "manifest"
    - from: "public/manifest.json"
      to: "public/icons/icon-192.png"
      via: "icons array src field"
      pattern: "icon-192"
---

<objective>
Add PWA manifest and Add to Home Screen support so the app can be installed on iOS and Android home screens with a proper icon, name, and standalone launch experience.

Purpose: The app is already deployed to Vercel; adding a manifest and the right meta tags is all that's needed to enable native-like installation on mobile devices.
Output: manifest.json, three icon files (192, 512, apple-touch-icon), updated root layout with PWA metadata.
</objective>

<execution_context>
@C:/Users/rinoa/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/rinoa/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/Users/rinoa/Desktop/FinansialTracker/src/app/layout.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create PWA icons</name>
  <files>public/icons/icon-192.png, public/icons/icon-512.png, public/icons/apple-touch-icon.png</files>
  <action>
    Generate three PNG icons using the Node.js canvas API or sharp (install if needed) — OR use a simpler approach: create a script that generates solid-color PNG files as placeholders and write them to public/icons/.

    Preferred approach (no extra deps): Use the `sharp` package if already available; otherwise install it temporarily and generate icons with a script, then uninstall.

    Actually, simplest viable approach with zero deps: Use the existing SVG at public/file.svg as a source if suitable, or create a small Node script that writes minimal valid PNG bytes.

    Best practical approach: Create an inline Node script that uses `canvas` or draws a simple colored square PNG using raw PNG encoding, then run it once.

    Concrete implementation:
    1. Create the directory: `mkdir -p public/icons`
    2. Write a one-off script `scripts/gen-icons.mjs` that:
       - Uses the `sharp` library (install as dev dep: `npm install --save-dev sharp`)
       - Creates a 512x512 dark-green (#1a5c38) square with the letter "F" centered in white using SVG input fed to sharp
       - Outputs `public/icons/icon-512.png`
       - Resizes to 192x192 → `public/icons/icon-192.png`
       - Resizes to 180x180 → `public/icons/apple-touch-icon.png`
    3. Run `node scripts/gen-icons.mjs`
    4. Delete `scripts/gen-icons.mjs` after icons are generated (it's a one-off)
    5. Optionally uninstall sharp after: `npm uninstall sharp` (leave installed if preferred — useful for future icon updates)

    The SVG source to feed to sharp:
    ```svg
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="80" fill="#1a5c38"/>
      <text x="256" y="340" font-family="sans-serif" font-size="280" font-weight="bold"
            fill="white" text-anchor="middle">F</text>
    </svg>
    ```
  </action>
  <verify>
    `ls -la public/icons/` shows icon-192.png, icon-512.png, apple-touch-icon.png all > 500 bytes.
  </verify>
  <done>Three PNG icon files exist in public/icons/ with correct dimensions and non-trivial file sizes.</done>
</task>

<task type="auto">
  <name>Task 2: Create manifest.json and wire up PWA metadata in layout</name>
  <files>public/manifest.json, src/app/layout.tsx</files>
  <action>
    1. Create `public/manifest.json`:
    ```json
    {
      "name": "Finance Tracker",
      "short_name": "FinTracker",
      "description": "Quick daily expense logging with clear visualization of spending patterns",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#0f172a",
      "theme_color": "#1a5c38",
      "orientation": "portrait-primary",
      "icons": [
        {
          "src": "/icons/icon-192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "any maskable"
        },
        {
          "src": "/icons/icon-512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "any maskable"
        }
      ]
    }
    ```

    2. Update `src/app/layout.tsx` — replace the existing `metadata` export and add viewport export. The metadata export must use Next.js Metadata API fields for PWA. Add `manifest`, `appleWebApp`, `themeColor`, and icons. Also export a `viewport` object for the theme color (Next.js 14+ separates viewport from metadata).

    The updated layout.tsx should look like this (keep all existing font/className logic unchanged, only touch the exports at the top):

    ```tsx
    import type { Metadata, Viewport } from "next";
    import { Geist, Geist_Mono } from "next/font/google";
    import "./globals.css";

    // ... font declarations unchanged ...

    export const metadata: Metadata = {
      title: "Finance Tracker",
      description: "Quick daily expense logging with clear visualization of spending patterns",
      manifest: "/manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "FinTracker",
      },
      icons: {
        apple: "/icons/apple-touch-icon.png",
      },
    };

    export const viewport: Viewport = {
      themeColor: "#1a5c38",
    };

    export default function RootLayout({ ... }) { ... }
    ```

    Do NOT add manual `<link rel="manifest">` or `<meta name="theme-color">` tags to the JSX — Next.js injects those automatically from the metadata/viewport exports. Keep the `<html>` and `<body>` JSX identical to what exists now.
  </action>
  <verify>
    1. `npm run build` completes with no errors.
    2. `curl http://localhost:3000/manifest.json` (after `npm run dev`) returns valid JSON with `"display": "standalone"`.
    3. View page source at localhost:3000 and confirm `<link rel="manifest" href="/manifest.json">` is present in `<head>`.
    4. Confirm `<meta name="theme-color" content="#1a5c38">` is in `<head>`.
    5. Confirm `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">` is in `<head>`.
  </verify>
  <done>
    manifest.json is served at /manifest.json. Root layout emits manifest link, theme-color meta, and apple-touch-icon link. Build succeeds. App is installable on Android (meets manifest + HTTPS criteria already satisfied by Vercel) and shows correct icon/name on iOS home screen.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>PWA manifest, three icons, and all required meta tags wired into root layout.</what-built>
  <how-to-verify>
    **Android Chrome (or DevTools simulation):**
    1. Open the deployed Vercel URL in Chrome on Android (or use Chrome DevTools > Application > Manifest on desktop).
    2. In DevTools: Application tab > Manifest — confirm name, icons, display=standalone all shown without errors.
    3. On Android: Chrome menu should show "Add to Home Screen" or "Install app".
    4. Install it and open from home screen — app should open without browser chrome (no address bar).

    **iOS Safari:**
    1. Open the deployed URL in Safari on iPhone/iPad.
    2. Tap Share > Add to Home Screen.
    3. Confirm the icon shows the green "F" icon and the name shows "FinTracker".
    4. Open from home screen — app should open in standalone mode (no Safari chrome).

    **Quick DevTools check (desktop):**
    1. `npm run dev` locally, open http://localhost:3000.
    2. DevTools > Application > Manifest — should show all fields without errors.
    3. DevTools > Application > Service Workers — no errors expected (no SW in this plan).
  </how-to-verify>
  <resume-signal>Type "approved" if Add to Home Screen works correctly, or describe any issues.</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` passes with no TypeScript or Next.js errors
- `/manifest.json` returns valid JSON with `display: standalone`, correct icon paths, `theme_color`
- Page `<head>` contains manifest link, theme-color, and apple-touch-icon link (verified via view-source or DevTools)
- Icons exist at `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/apple-touch-icon.png`
</verification>

<success_criteria>
The app can be added to the iOS and Android home screen with the correct icon (green "F") and name ("FinTracker"), and launches in standalone mode (no browser address bar) when opened from the home screen.
</success_criteria>

<output>
After completion, create `.planning/quick/3-add-pwa-manifest-and-add-to-home-screen-/3-SUMMARY.md`
</output>
