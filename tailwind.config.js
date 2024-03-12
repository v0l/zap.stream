/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        "3xl": "1920px",
      },
      colors: {
        "layer-0": "#0a0a0a",
        "layer-1": "rgb(23 23 23 / <alpha-value>)",
        "layer-2": "rgb(34 34 34 / <alpha-value>)",
        "layer-3": "rgb(50 50 50 / <alpha-value>)",
        "layer-4": "rgb(121 121 121 / <alpha-value>)",
        "layer-5": "rgb(173 173 173 / <alpha-value>)",
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
      backgroundImage: {
        "category-gradient-1":
          "linear-gradient(90deg, #5433FF 0%, #3B77FF 24.5%, #20BDFF 50%, #60DCE6 74%, #A5FECB 100%)",
        "category-gradient-2": "linear-gradient(90deg, #9796F0 0%, #C6ADE3 46.5%, #FBC7D4 100%)",
        "category-gradient-3": "linear-gradient(90deg, #FFE259 0%, #FFC555 48.5%, #FFA751 100%)",
        "category-gradient-4": "linear-gradient(90deg, #1488CC 0%, #1F5EBF 48.5%, #2B32B2 100%)",
        "category-gradient-5": "linear-gradient(90deg, #CC2B5E 0%, #A33272 47.5%, #753A88 100%)",
        "category-gradient-6": "linear-gradient(90deg, #ED4264 0%, #F5928D 46.5%, #FFEDBC 100%)",
        "category-gradient-7": "linear-gradient(90deg, #A8C0FF 0%, #7375CA 50.5%, #3F2B96 100%)",
      },
    },
  },
  plugins: [],
};
