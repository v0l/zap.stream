/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "gray-1": "#171717",
        "gray-2": "#222",
        primary: "var(--primary)",
      },
      animation: {
        "ping-once": "ping 1s cubic-bezier(0, 0, 0.2, 1);",
      },
    },
  },
  plugins: [],
};
