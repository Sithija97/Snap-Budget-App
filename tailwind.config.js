/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          black:   "#0F1117",
          green:   "#1D9E75",
          green2:  "#0F6E56",
          red:     "#E24B4A",
          amber:   "#EF9F27",
          muted:   "#94A3B8",
          border:  "#E8EDF2",
          surface: "#F8F9FA",
        },
      },
      fontFamily: {
        sans:   ["DMSans_400Regular"],
        medium: ["DMSans_500Medium"],
        mono:   ["DMMono_400Regular"],
      },
    },
  },
  plugins: [],
};
