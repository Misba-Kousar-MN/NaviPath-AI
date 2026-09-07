/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          'soft-mint': '#CFE5D5',
          'pastel-green': '#B8D6B2',
          'aqua-breeze': '#A6D2C8',
          'seafoam': '#8FC6B7',
          'teal-mist': '#6EA89E',
          'deep-teal': '#488E83',
          'dark-teal': '#2E6159',
          'surface': '#F7FAF8',
          'card': '#FFFFFF',
          'border': '#E2EDE6',
          'text-dark': '#1C2E28',
          'text-muted': '#4A6058',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(110, 168, 158, 0.08)',
        'medium': '0 4px 20px rgba(72, 142, 131, 0.12)',
        'lifted': '0 8px 30px rgba(72, 142, 131, 0.16)',
      },
    },
  },
  plugins: [],
}
