/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-10px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(10px)" }
        }
      },
      animation: {
        shake: "shake 0.5s ease-in-out"
      },
      colors: {
        white: "white",
        none: "none"
      },
      borderWidth: {
        1: "1px"
      },
      fontFamily: ["Montserrat", "sans-serif"]
    }
  },
  variants: {},
  plugins: []
};
