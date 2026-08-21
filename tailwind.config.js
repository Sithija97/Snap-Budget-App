/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./context/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Page bg sits one step below card so borderless white/elevated cards
        // read as surfaces (light: slate-100 under white; dark: near-black
        // under zinc-900). muted must stay visible ON a card, hence one step
        // above card in dark.
        background:  { DEFAULT: '#f1f5f9', dark: '#0b0f19' },
        foreground:  { DEFAULT: '#09090b', dark: '#fafafa' },
        card:        { DEFAULT: '#ffffff', dark: '#1a1f2e' },
        border:      { DEFAULT: '#e4e4e7', dark: '#374151' },
        input:       { DEFAULT: '#e4e4e7', dark: '#374151' },
        muted:       { DEFAULT: '#f4f4f5', dark: '#242b3d' },
        mutedFg:     { DEFAULT: '#71717a', dark: '#9ca3af' },
        accent:      { DEFAULT: '#18181b', dark: '#fafafa' },
        accentFg:    { DEFAULT: '#fafafa', dark: '#18181b' },
        destructive: { DEFAULT: '#ef4444', dark: '#ef4444' },
        ring:        { DEFAULT: '#09090b', dark: '#d4d4d8' },
        positive:    { DEFAULT: '#16a34a', dark: '#22c55e' },
        negative:    { DEFAULT: '#dc2626', dark: '#f87171' },
        warning:     { DEFAULT: '#d97706', dark: '#fbbf24' },
      },
      fontFamily: {
        sans:      ["Inter_400Regular"],
        medium:    ["Inter_500Medium"],
        semibold:  ["Inter_600SemiBold"],
        bold:      ["Inter_700Bold"],
        extrabold: ["Inter_800ExtraBold"],
        black:     ["Inter_900Black"],
      },
    },
  },
  plugins: [],
};
