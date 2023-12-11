/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{html,tsx,jsx,ejs}'],
  theme: {
    extend: {
      screens: {
        dp: '768px',
      },
    },
  },
  plugins: [
    function ({ addUtilities, matchVariant, matchUtilities }) {
      addUtilities({
        '.f-i-center': {
          display: 'flex',
          alignItems: 'center',
        },
        '.f-center': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '.f-col': {
          display: 'flex',
          flexDirection: 'column',
        },
      })
    },
  ],
  corePlugins: {
    preflight: false,
  },
}
