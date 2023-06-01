import { FC, useEffect, useRef, useState } from 'react'
import { extStorage } from './utils/storage'
import {
  Box,
  Button,
  Card,
  Center,
  ChakraProvider,
  Flex,
  Input,
  Switch,
  Toast,
  useToast,
} from '@chakra-ui/react'
import configStore, {
  BaseConfig,
  ConfigField,
  baseConfigMap,
} from './store/config'
import { isBoolean } from 'lodash-es'
import WebProvider from './web-provider/webProvider'
import OptionProvider from './web-provider/option'
import { DanType } from './danmaku'
import { useOnce } from './hook'
import { observer } from 'mobx-react'

window.extStorage = extStorage
window.configStore = configStore

// TODO ？自定义弹幕
const dans: DanType[] = [
  {
    text: '这是弹幕A----------------',
    time: 1,
    color: 'white',
    type: 'right',
  },
  {
    text: '这是弹幕B',
    time: 1.2,
    color: 'blue',
    type: 'right',
  },
  {
    text: '这是弹幕C',
    time: 1.4,
    color: '#6cf',
    type: 'right',
  },
  {
    text: '这是弹幕D',
    time: 2.5,
    color: '#777',
    type: 'right',
  },
]

type ConfigEntries = [string, ConfigField<any>][]
// TODO options page
const Page_options: FC = observer((props) => {
  let [newConfig, setNewConfig] = useState<Partial<BaseConfig>>({})
  let [videoSrc, setVideoSrc] = useState('')
  let providerRef = useRef<WebProvider>()
  let containerRef = useRef<HTMLDivElement>()
  let [isAdvShow, setAdvShow] = useState(false)
  const toast = useToast()

  useOnce(() => {
    document.title = '设置'
    toast({
      status: 'warning',
      title: '实时效果面板未完成，可能出现需要刷新下才看到正确效果的情况',
    })
  })
  useEffect(() => {
    if (!videoSrc) return

    let provider = new OptionProvider(dans)
    providerRef.current = provider
    containerRef.current.appendChild(provider.miniPlayer.canvas)
    window.provider = provider
  }, [videoSrc])

  let configEntries = Object.entries(baseConfigMap)

  const baseConfigEntries: ConfigEntries = [],
    advConfigEntries: ConfigEntries = []

  configEntries.forEach(([key, _val]) => {
    const val = { ..._val, defaultValue: (configStore as any)[key] }
    if (val.deprecated) advConfigEntries.push([key, val])
    else baseConfigEntries.push([key, val])
  })

  const handleSaveConfig = () => {
    configStore
      .setConfig(newConfig)
      .then(() => {
        toast({
          title: '保存成功',
          status: 'success',
        })
      })
      .catch((err) => {
        console.error(err)
        toast({
          title: '保存失败，请查看控制台报错',
          colorScheme: 'red',
          status: 'error',
        })
      })
  }

  return (
    <ChakraProvider>
      <Box fontSize={'14px'} position={'relative'}>
        <Flex>
          <Box flex={1}>
            <ConfigEntriesBox
              config={baseConfigEntries}
              newConfig={newConfig}
              setNewConfig={setNewConfig}
            />
            <Button colorScheme="teal" onClick={() => setAdvShow(true)}>
              显示非必要设置
            </Button>
            <Box overflow="hidden" maxHeight={isAdvShow ? 'initial' : '0'}>
              <ConfigEntriesBox
                config={advConfigEntries}
                newConfig={newConfig}
                setNewConfig={setNewConfig}
              />
            </Box>
          </Box>
          <Box width={480} p="24px">
            <h2>传入一个视频进行效果展示</h2>
            <Input
              m={'12px 0'}
              type="file"
              accept="video/*"
              onChange={(e) => {
                setVideoSrc(URL.createObjectURL(e.target?.files?.[0]))
              }}
            />
            {videoSrc && (
              <>
                <video src={videoSrc} width={'100%'} controls></video>
                <Button
                  colorScheme="teal"
                  m={'12px 0'}
                  onClick={() => providerRef.current.startPIPPlay()}
                >
                  开始画中画
                </Button>
                <Card
                  p={'8px'}
                  ref={containerRef}
                  overflow={'auto'}
                  width={'100%'}
                  background="blackAlpha.50"
                >
                  <h3>这里是canvas画布</h3>
                </Card>
              </>
            )}
          </Box>
        </Flex>
        <Box height={'84px'}></Box>
        <Flex
          height={'60px'}
          px="24px"
          position={'fixed'}
          bottom={0}
          width={'100%'}
          background={'#fff'}
          boxShadow={'0px -3px 4px rgba(55, 60, 68, 0.2)'}
        >
          <Center ml={'auto'}>
            <Button colorScheme="teal" onClick={handleSaveConfig}>
              保存
            </Button>
          </Center>
        </Flex>
      </Box>
    </ChakraProvider>
  )
})

const ConfigEntriesBox: FC<{
  config: ConfigEntries
  newConfig: Partial<BaseConfig>
  setNewConfig: React.Dispatch<React.SetStateAction<Partial<BaseConfig>>>
}> = (props) => {
  return (
    <Box>
      {props.config.map(([key, val]: [string, ConfigField<any>], i) => (
        <Box
          padding={'6px 8px'}
          backgroundColor={i % 2 == 0 ? 'blackAlpha.50' : 'white'}
          className="row"
          key={i}
        >
          <Flex gap={'12px'}>
            <Center textAlign={'center'} width={140} whiteSpace={'pre-wrap'}>
              {val.label ?? key}:
            </Center>
            <Box flex={1}>
              <Flex gap={'12px'}>
                <Center flex={1}>
                  <ConfigRowAction
                    config={val}
                    onChange={(v) => {
                      props.setNewConfig((c) => ({ ...c, [key]: v }))
                    }}
                    newVal={(props.newConfig as any)[key]}
                  />
                </Center>
                <Center>
                  <Button
                    isDisabled={!(props.newConfig as any)[key]}
                    colorScheme="red"
                    size={'sm'}
                    onClick={() => {
                      delete (props.newConfig as any)[key]
                      props.setNewConfig((c) => ({ ...c }))
                    }}
                  >
                    重置
                  </Button>
                </Center>
              </Flex>
              {val.desc && (
                <Box mt={'4px'} flex={1} fontSize={'12px'} color={'blue.500'}>
                  {val.desc}
                </Box>
              )}
            </Box>
          </Flex>
        </Box>
      ))}
    </Box>
  )
}

const ConfigRowAction = (props: {
  config: ConfigField<any>
  onChange: (v: any) => void
  newVal: any
}) => {
  let val = props.config.defaultValue
  console.log('val', props.newVal, val)
  if (isBoolean(val))
    return (
      <Switch
        isChecked={props.newVal ?? val}
        marginRight={'auto'}
        onChange={(e) => {
          props.onChange(e.target.checked)
        }}
      />
    )
  return (
    <Input
      value={props.newVal ?? val}
      onChange={(e) => {
        props.onChange(e.target.value)
      }}
    />
  )
}

export default Page_options
