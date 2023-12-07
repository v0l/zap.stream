/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "gray-1": "#171717",
        "gray-2": "#222",
        "gray-3": "#797979",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        zap: "var(--zap)",
      },
      animation: {
        "ping-once": "ping 1s cubic-bezier(0, 0, 0.2, 1);",
        flash: "pulse 0.5s 6 linear;"
      },
    },
  },
  plugins: [],
};
