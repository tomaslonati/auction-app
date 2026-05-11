/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#151515',
        background: '#E8EAEC',
        surface: '#FFFFFF',
        success: '#22C55E',
        error: '#DC2626',
        muted: '#6B7280',
        placeholder: '#808A88',
      },
    },
  },
  plugins: [],
};
