/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Habilita dark mode via classe 'dark' no HTML
    theme: {
        extend: {},
    },
    plugins: [],
}
