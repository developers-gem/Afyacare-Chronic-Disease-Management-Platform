/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2333",
        indigo: {
          50: "#EEF1F8",
          100: "#D6DCEE",
          400: "#5A6FA8",
          500: "#374B82",
          600: "#26355D",
          700: "#1C2848",
          900: "#131B33",
        },
        terracotta: {
          50: "#FDF1EE",
          100: "#FADCD3",
          400: "#EC9583",
          500: "#E2725B",
          600: "#C85A44",
          700: "#A2452F",
        },
        gold: {
          50: "#FBF4E4",
          400: "#E6BE72",
          500: "#D9A441",
          600: "#B78530",
        },
        sand: {
          50: "#FBF9F5",
          100: "#F5F1E9",
          200: "#EDE6D8",
        },
        sage: {
          500: "#4F8A6F",
          600: "#3C6E58",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,35,51,0.06), 0 4px 16px rgba(28,35,51,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
