/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#118DFF',
        secondary: '#3BA1FF',
        dark: {
          DEFAULT: '#0F172A',
          lighter: '#1E293B'
        }
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: '#118DFF',
              '&:hover': {
                color: '#3BA1FF',
              },
            },
          },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
