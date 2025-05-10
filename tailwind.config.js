/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#BA0000",
        secondary: "#E4E4E4",
        accent: "#323232",
        accent2: "#804430",
        accent3: "#fb923c",
      },
      fontFamily: {
        outfit: ["Outfit"],
        michroma: ["Michroma"],
        poppins: ["Poppins"],
        monstserrat: ["Montserrat"],
      },
    },
  },
  plugins: [],
};
