/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vancore: {
          dark: '#0a0a0f',
          navy: '#0d1b2a',
          bronze: '#c9a84c',
          gold: '#d4af37',
          light: '#f5f0e8',
          muted: '#8a8a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
