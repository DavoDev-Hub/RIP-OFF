/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Ensure Tailwind scans all components for classes
  ],
  theme: {
    extend: {
      fontFamily:{
        primaryCircular:['Circular'],
      }
    },
  },
  plugins: [],
}
