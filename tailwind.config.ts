import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0E0F18",
          dark: "#0A0B14",
          border: "#1F1E24",
        },
        secondary: {
          DEFAULT: "#9D9EA6",
          dark: "#6D6E7A",
          light: "#B8B9C3",
        },
        gradient: {
          from: "#1D1E2C",
          to: "#252736",
          hover: {
            from: "#22243A",
            to: "#2A2C44",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
