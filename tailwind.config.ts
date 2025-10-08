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
        // SaaSinaSnap Brand Colors
        primary: {
          DEFAULT: "#6366f1", // Indigo - Modern, trustworthy
          light: "#818cf8",
          dark: "#4f46e5",
        },
        secondary: {
          DEFAULT: "#8b5cf6", // Purple - Creative, innovative
          light: "#a78bfa",
          dark: "#7c3aed",
        },
        accent: {
          DEFAULT: "#06b6d4", // Cyan - Tech-forward, fresh
          light: "#22d3ee",
          dark: "#0891b2",
        },
      },
    },
  },
  plugins: [require("tailgrids/plugin")],
};
export default config;
