/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,tsx,jsx,ejs}'],
  theme: {
    screens: {
      xs: '390px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    extend: {
      boxShadow: {
        'pricing-card': '0px 0px 24px rgba(42, 41, 128, 0.08)',
      },
      screens: {
        dp: '768px',
      },
    },
  },
  plugins: [
    function ({ addUtilities, matchVariant, matchUtilities }) {
      matchUtilities({
        'min-font': (value) => {
          const [size, lh] = value.split(',')
          const cWidth = 1440
          return {
            fontSize: `min(calc(${(+size / cWidth) * 100}vw), calc(${size}px))`,
            lineHeight: `calc(${+lh / +size})`,
          }
        },
        min: (value) => {
          const [key, val] = value.split(',')
          const cWidth = 1440
          return {
            [key]: `min(calc(${(+val / cWidth) * 100}vw), calc(${val}px))`,
          }
        },
      })
    },
  ],
  corePlugins: {
    preflight: false,
  },
}
