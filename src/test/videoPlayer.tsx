import '@apad/setting-panel/lib/index.css'
import '@root/components/VideoPlayer/index.less'
import 'webextension-polyfill'
import '@root/style/global.css'
import '@root/style'
import { dq1 } from '@root/utils'
import react from 'react-dom/client'
import App from './videoPlayer_App'

react.createRoot(dq1('#app')!).render(<App />)
