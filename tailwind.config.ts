import type { Config } from "tailwindcss";
const colors = require('tailwindcss/colors')

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ...colors,
        // SaaSinaSnap Brand Colors - Vibrant & Modern
        primary: {
          DEFAULT: "#8B5CF6", // Purple - Creativity, innovation, premium
          light: "#A78BFA",
          dark: "#7C3AED",
        },
        secondary: {
          DEFAULT: "#10B981", // Emerald Green - Growth, success
          light: "#34D399",
          dark: "#059669",
        },
        accent: {
          DEFAULT: "#F59E0B", // Amber - Energy, warmth, attention
          light: "#FBBF24",
          dark: "#D97706",
        },
      },
    },
  },
  plugins: [require("tailgrids/plugin")],
};
export default config;
