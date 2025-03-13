import '../polyfill/browser/index'
import '@root/contents/clogInject'
import { dq1 } from '@root/utils'
import { createRoot } from 'react-dom/client'
import App from './App'

const root = dq1('#app')!

createRoot(root).render(<App />)
