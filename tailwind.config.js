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
      boxShadow: {
        glow: '0 0 20px rgba(17, 141, 255, 0.3)',
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
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-position': '100% 50%',
          },
          '50%': {
            'background-position': '0% 50%',
          },
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};