import { FC, useState } from 'react'
import { extStorage } from './utils/storage'
import {
  Box,
  Button,
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

window.extStorage = extStorage
window.configStore = configStore

let configEntries = Object.entries(baseConfigMap)

// TODO options page
const Page_options: FC = (props) => {
  let [newConfig, setNewConfig] = useState<Partial<BaseConfig>>({})
  return (
    <ChakraProvider>
      <Flex fontSize={'14px'}>
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
        </Box>
      </Flex>
    </ChakraProvider>
  )
}

const ConfigRowAction = (props: {
  config: ConfigField<any>
  onChange: (v: any) => void
  newVal: any
}) => {
  let val = props.config.defaultValue
  if (isBoolean(val))
    return (
      <Switch
        checked={props.newVal ?? val}
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
