import CCWs from '@root/danmaku/cc/websocket'
import { useOnce } from '@root/hook'
import { FC } from 'react'

const Page_test: FC = (props) => {
  useOnce(() => {
    const ccWs = new CCWs('390598429')
    console.log(ccWs)
  })
  return <div>this is test page</div>
}

export default Page_test
