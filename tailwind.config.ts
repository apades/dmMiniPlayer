import remToPx from 'tailwindcss-rem-to-px'
import containerQuery from './packages/container-queries'

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{html,tsx,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        'btn-shadow': 'var(--btn-shadow, 0px 2px 4px rgba(55, 60, 68, 0.2))',
      },
      screens: {
        dp: '768px',
        mb: { raw: '((max-height:1024px) or (max-width:768px))' },
      },
      containers: {
        dp: '768px',
        mb: { raw: '(height > 300px)' },
      },
      colors: {
        main: 'var(--main, #0669ff)',
        bg: '#262626',
        'bg-hover': '#404040',
      },
      width: {
        'side-width': 'var(--side-width, 200px)',
        'btn-size': 'var(--btn-size, 120px)',
      },
      height: {
        'area-height': 'var(--area-height, 40px)',
        'btn-size': 'var(--btn-size, 120px)',
      },
    },
  },
  plugins: [
    function ({ addUtilities, matchVariant, matchUtilities }) {
      addUtilities({
        '.f-center': {
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'center',
        },
        '.f-i-center': {
          display: 'flex',
          'align-items': 'center',
        },
        '.custom-scrollbar': {
          '&::-webkit-scrollbar': {
            width: '10px',
            height: '10px',
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#fff7',
            'background-clip': 'content-box',
            border: '2px solid transparent',
            'border-radius': '16px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#fffa',
          },
          '&::-webkit-scrollbar-track': {
            display: 'none',
          },
        },
        '.flex-col': {
          display: 'flex',
        },
        '.ab-center': {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        },
        '.ab-vertical-center': {
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
        },
        '.vp-cover-icon-bg': {
          'backdrop-filter': 'blur(2.71828px)',
          background: '#fffc',
        },
      })

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
        wh: (value) => {
          const [width, height] = value.split(',')
          const entries = [
            ['width', width],
            ['height', height || width],
          ]
          return Object.fromEntries(entries)
        },
        lgtext: (value) => {
          const [deg, from, to] = value.split(',')

          return {
            background: `-webkit-linear-gradient(${deg}deg, ${from}, ${to})`,
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
          }
        },
        bor: (value) => {
          const [color, width = '1px', rounded] = value.split(',')
          const entries = [
            ['borderWidth', width],
            ['borderColor', color],
            ['borderRadius', rounded],
          ].filter((v) => !!v[1])
          return Object.fromEntries(entries)
        },
        'bor-l': (value) => {
          const [color, width = '1px', rounded] = value.split(',')
          const entries = [
            ['borderWidth', `0 0 0 ${width}`],
            ['borderColor', color],
            ['borderRadius', rounded],
          ].filter((v) => !!v[1])
          return Object.fromEntries(entries)
        },
        'bor-r': (value) => {
          const [color, width = '1px', rounded] = value.split(',')
          const entries = [
            ['borderWidth', `0 ${width} 0 0`],
            ['borderColor', color],
            ['borderRadius', rounded],
          ].filter((v) => !!v[1])
          return Object.fromEntries(entries)
        },
        'bor-t': (value) => {
          const [color, width = '1px', rounded] = value.split(',')
          const entries = [
            ['borderWidth', `${width} 0 0 0`],
            ['borderColor', color],
            ['borderRadius', rounded],
          ].filter((v) => !!v[1])
          return Object.fromEntries(entries)
        },
        'bor-b': (value) => {
          const [color, width = '1px', rounded] = value.split(',')
          const entries = [
            ['borderWidth', ` 0 0 ${width} 0`],
            ['borderColor', color],
            ['borderRadius', rounded],
          ].filter((v) => !!v[1])
          return Object.fromEntries(entries)
        },
      })
    },
    remToPx({}),
    containerQuery,
  ],
  corePlugins: {
    preflight: false,
  },
}

module.exports = config
