/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:       "#F5F7FC",
          card:     "#FFFFFF",
          text:     "#1A1D23",
          sub:      "#8A94A6",
          border:   "#F0F2F7",
          green:    "#00C170",
          greenBg:  "#E6FAF4",
          red:      "#FF5A5F",
          redBg:    "#FFF0F1",
          blue:     "#4A7AFF",
          blueBg:   "#EEF2FF",
          amber:    "#FF9F40",
          amberBg:  "#FFF4E5",
          purple:   "#9B6BFF",
          purpleBg: "#F3EEFF",
          teal:     "#00B8D9",
          tealBg:   "#E5F8FC",
          pink:     "#FF6B9D",
          pinkBg:   "#FFF0F6",
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
