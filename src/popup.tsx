import { FC } from 'react'
import { useOnce } from './hook'
import { sendToContentScript } from '@plasmohq/messaging'

const Page_popup: FC = (props) => {
  useOnce(() => {
    sendToContentScript({ name: 'player-startPIPPlay' })
    window.close()
  })
  return <></>
}

export default Page_popup
