import isDev from '@root/shared/isDev'
import './tailwind.css'
import './tailwindBase.css'
import '@apad/rc-slider/assets/index.css'

if (isDev) {
  import('@apad/setting-panel/lib/index.css')
}
