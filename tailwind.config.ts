import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      screens: {
        tablet: "600px",
        desktop: "1024px"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Noto Sans Thai", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ocean: {
          50: "#eff8ff",
          100: "#dceffd",
          200: "#bfdef7",
          300: "#91c8ef",
          400: "#56a9df",
          500: "#258acb",
          600: "#1677b8",
          700: "#125f98",
          800: "#124f7d",
          900: "#143f63"
        }
      },
      boxShadow: {
        card: "0 8px 30px -18px rgb(15 45 65 / 18%)"
      }
    }
  },
  plugins: []
};

export default config;
