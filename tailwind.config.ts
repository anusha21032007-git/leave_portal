import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./*.html",
    "./pages/*.html",
    "./js/*.js", // Include JS files for dynamic class generation
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        xl: "1rem", // Custom for rounded shapes
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        // Removed accordion keyframes as they are React specific
      },
      animation: {
        // Removed accordion animations
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;