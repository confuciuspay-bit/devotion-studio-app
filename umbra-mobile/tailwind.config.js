/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "rgb(10, 10, 20)",
        foreground: "rgb(250, 250, 252)",
        card: "rgb(16, 16, 28)",
        "card-foreground": "rgb(250, 250, 252)",
        primary: "rgb(99, 102, 241)",
        "primary-foreground": "rgb(255, 255, 255)",
        muted: "rgb(30, 30, 46)",
        "muted-foreground": "rgb(140, 140, 160)",
        destructive: "rgb(239, 68, 68)",
        success: "rgb(16, 185, 129)",
        border: "rgba(255,255,255,0.06)",
        popover: "rgb(20, 20, 34)",
        secondary: "rgba(255,255,255,0.06)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
