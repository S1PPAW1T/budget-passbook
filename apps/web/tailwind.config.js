/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans Thai', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        // Dark theme (green ledger)
        dark: {
          paper: '#0B0F0D',
          deep: '#161D19',
          line: '#2B3A30',
          ink: '#DDF2E2',
          soft: '#7FA08C',
          income: '#46DE82',
          expense: '#FF7A59',
          gold: '#D9B23C',
          surface: '#121815',
        },
        // Light theme (paper ledger)
        light: {
          paper: '#F7F2E7',
          deep: '#EDE6D3',
          line: '#C8BAA0',
          ink: '#1F3A5C',
          soft: '#7A8FA6',
          income: '#2F6F4F',
          expense: '#B0463C',
          gold: '#B8860B',
          surface: '#FDFAF2',
        },
      },
    },
  },
  plugins: [],
};
