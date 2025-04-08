import '../polyfill/browser/index'
import { dq1 } from '@root/utils'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@root/style'

const root = dq1('#app')

createRoot(root).render(<App />)
