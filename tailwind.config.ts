import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ocean: { 50: "#effaff", 100: "#d9f3fb", 500: "#1596b4", 600: "#087b98", 900: "#123b4a" } } } },
  plugins: []
};
export default config;
