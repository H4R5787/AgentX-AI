import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0b0f',
        surface: '#12141a',
        'surface-2': '#1a1d26',
        border: '#1e2029',
        'border-2': '#2a2d3a',
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          50: '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
        },
        accent: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
} satisfies Config
