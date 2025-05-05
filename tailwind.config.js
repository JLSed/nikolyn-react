/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0A4D9F",
        secondary: "#DBDDDA",
        accent: "#B59268",
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
