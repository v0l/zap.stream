/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "gray-1": "#171717",
        "gray-2": "#222"
      },
    },
  },
  plugins: [],
};
