import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Navy & Blue Palette
        navy: {
          50: '#f8f9fa',
          100: '#ecf0f1',
          200: '#d5dbdb',
          300: '#bdc3c7',
          400: '#95a5a6',
          500: '#7f8c8d',
          600: '#5a6c7d',
          700: '#34495e',
          800: '#2c3e50',
          900: '#1a252f',
        },
        blue: {
          50: '#ebf5fb',
          100: '#d6eaf8',
          200: '#aed6f1',
          300: '#85c1e9',
          400: '#5dade2',
          500: '#3498db', // Primary action blue
          600: '#2e86c1',
          700: '#2874a6',
          800: '#21618c',
          900: '#1b4f72',
        },
        gray: {
          50: '#fafbfc',
          100: '#f8f9fa',
          200: '#ecf0f1',
          300: '#d5dbdb',
          400: '#bdc3c7',
          500: '#95a5a6',
          600: '#7f8c8d',
          700: '#5a6c7d',
          800: '#34495e',
          900: '#2c3e50',
        },
        // Semantic Colors
        success: {
          50: '#e8f8f5',
          100: '#d4efdf',
          200: '#a9dfbf',
          300: '#7dcea0',
          400: '#52be80',
          500: '#27ae60', // Primary success
          600: '#229954',
          700: '#1e8449',
          800: '#196f3d',
          900: '#145a32',
        },
        warning: {
          50: '#fef5e7',
          100: '#fdebd0',
          200: '#fad7a0',
          300: '#f8c471',
          400: '#f5b041',
          500: '#f39c12', // Primary warning
          600: '#dc7f0b',
          700: '#b8690a',
          800: '#935308',
          900: '#6e3d07',
        },
        danger: {
          50: '#fdedec',
          100: '#fadbd8',
          200: '#f5b7b1',
          300: '#f1948a',
          400: '#ec7063',
          500: '#e74c3c', // Primary danger
          600: '#cb4335',
          700: '#b03a2e',
          800: '#943126',
          900: '#78281f',
        },
        info: {
          50: '#ebf5fb',
          100: '#d6eaf8',
          200: '#aed6f1',
          300: '#85c1e9',
          400: '#5dade2',
          500: '#3498db',
          600: '#2e86c1',
          700: '#2874a6',
          800: '#21618c',
          900: '#1b4f72',
        },
      },
      // Professional spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '104': '26rem',
        '112': '28rem',
        '128': '32rem',
      },
      // Professional shadows
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
        // Professional card shadow
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
      // Professional border radius
      borderRadius: {
        'none': '0',
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      // Professional font sizes
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      // Professional font weights
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      // Professional transitions
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
      },
      // Professional z-index
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
    },
  },
  plugins: [],
};

export default config;
