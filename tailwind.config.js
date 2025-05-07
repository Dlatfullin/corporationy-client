/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      "light",
      {
        black: {
          ...require("daisyui/src/theming/themes")['pastel'],
          primary: "rgb(29, 155, 240)",
          secondary: "rgb(24, 24, 24)",
          "base-100": "rgb(251, 207, 232)", 
        },
      },
    ],
  },
}