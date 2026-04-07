/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🔥 conecta Tailwind con tus variables CSS
        background: "var(--background)",
        foreground: "var(--foreground)",

        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",

        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",

        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        "accent-magenta": "var(--accent-magenta)",

        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",

        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",

        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        // extras útiles
        success: "var(--success)",
        warning: "var(--warning)",
      },
      keyframes: {
        fly: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        progress: {
          "0%": { width: "0%" },
          "100%": { width: "85%" },
        },
      },
      animation: {
        fly: "fly 0.4s ease-in-out infinite",
        progress: "progress 3s ease-out forwards",
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
      },
    },
  },
  plugins: [],
}