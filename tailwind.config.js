/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "layer-1": "rgb(23 23 23 / <alpha-value>)",
        "layer-2": "rgb(34 34 34 / <alpha-value>)",
        "layer-3": "rgb(50 50 50 / <alpha-value>)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        zap: "var(--zap)",
        success: "rgb(0 127 0 / <alpha-value>)",
        warning: "rgb(255 86 63 / <alpha-value>)",
      },
      animation: {
        "ping-once": "ping 1s cubic-bezier(0, 0, 0.2, 1);",
        flash: "pulse 0.5s 6 linear;",
      },
    },
  },
  plugins: [],
};
