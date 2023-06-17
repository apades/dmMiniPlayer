import { listen as portListen, getPort } from '@plasmohq/messaging/port'
// import { getPort } from '@plasmohq/messaging/background'
import { useOnce } from '@root/hook'
import { FC } from 'react'

const Page_performance: FC = (props) => {
  useOnce(async () => {
    let port = await getPort('page-performance')
    // 不支持往回传数据
    port.postMessage({ name: 'performance', body: '222' })
    console.log('port', port)
    port.onMessage.addListener((e) => {
      console.log('msg2', e)
    })
    // ----------
    // let port = await portListen('performance', (msg) => {
    //   console.log('msg1', msg)
    // })
    // port.port.onMessage.addListener((e) => {
    //   console.log('msg2', e)
    // })
  })

  return <div>Page_performance</div>
}

export default Page_performance
