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

window.extStorage = extStorage
window.configStore = configStore

let configEntries = Object.entries(baseConfigMap)

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

// TODO options page
const Page_options: FC = (props) => {
  let [newConfig, setNewConfig] = useState<Partial<BaseConfig>>({})
  let [videoSrc, setVideoSrc] = useState('')
  let providerRef = useRef<WebProvider>()
  let containerRef = useRef<HTMLDivElement>()

  useEffect(() => {
    if (!videoSrc) return

    let provider = new OptionProvider(dans)
    providerRef.current = provider
    containerRef.current.appendChild(provider.miniPlayer.canvas)
    // window.provider = provider
  }, [videoSrc])

  return (
    <ChakraProvider>
      <Box fontSize={'14px'} position={'relative'}>
        <Flex>
          <Box flex={1}>
            {configEntries.map(([key, val]: [string, ConfigField<any>], i) => (
              <Box
                padding={'6px 8px'}
                backgroundColor={i % 2 == 0 ? 'blackAlpha.50' : 'white'}
                className="row"
                key={i}
              >
                <Flex gap={'12px'}>
                  <Center
                    textAlign={'center'}
                    width={140}
                    whiteSpace={'pre-wrap'}
                  >
                    {val.label ?? key}:
                  </Center>
                  <Box flex={1}>
                    <Flex gap={'12px'}>
                      <Center flex={1}>
                        <ConfigRowAction
                          config={val}
                          onChange={(v) => {
                            setNewConfig((c) => ({ ...c, [key]: v }))
                          }}
                          newVal={(newConfig as any)[key]}
                        />
                      </Center>
                      <Center>
                        <Button
                          isDisabled={!(newConfig as any)[key]}
                          colorScheme="red"
                          size={'sm'}
                          onClick={() => {
                            delete (newConfig as any)[key]
                            setNewConfig((c) => ({ ...c }))
                          }}
                        >
                          重置
                        </Button>
                      </Center>
                    </Flex>
                    {val.desc && (
                      <Box
                        mt={'4px'}
                        flex={1}
                        fontSize={'12px'}
                        color={'blue.500'}
                      >
                        {val.desc}
                      </Box>
                    )}
                  </Box>
                </Flex>
              </Box>
            ))}
          </Box>
          <Box width={480} p="24px">
            <h2>效果展示</h2>
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
            <Button colorScheme="teal">保存</Button>
          </Center>
        </Flex>
      </Box>
    </ChakraProvider>
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
