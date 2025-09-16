import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { getEnvConf } from '@apad/env-tools/bundler'

const sp = StealthPlugin()
sp.enabledEvasions.delete('iframe.contentWindow')
sp.enabledEvasions.delete('media.codecs')
puppeteer.use(sp)

const env = getEnvConf()
console.log('env', env)
async function main() {
  if (!env.chrome_path) throw Error('需要创建.env文件，并且拥有chrome_path字段')
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: env.chrome_path,
    userDataDir: './userDataDir',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })

  const page = await browser.newPage()
  await page.goto(
    'https://chrome.google.com/webstore/devconsole/dfda58da-18fa-464a-9c96-6ce442514076/nahbabjlllhocabmecfjmcblchhpoclj/edit/listing',
  )

  await page.screenshot({ path: 'example.png' })

  await browser.disconnect()
}

main()
