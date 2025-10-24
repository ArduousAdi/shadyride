/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // 🌙 enables manual dark mode toggle via class
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {},

    // 📱 Responsive breakpoints (standard Tailwind)
    screens: {
      sm: "640px",   // small phones and up
      md: "768px",   // tablets and up
      lg: "1024px",  // laptops and up
      xl: "1280px",  // desktops
      "2xl": "1536px", // large screens
    },
  },

  plugins: [],
};
