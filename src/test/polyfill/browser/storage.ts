import { isArray, isNull, isObject } from 'lodash-es'
import _env from '../env'
import { sendMessageWaitResp } from '../message'
import { addCallback, executeCallback, removeCallback } from './'

const storage = {
  local: {
    get: (_keys?: null | string | string[] | Record<string, any>) => {
      let keys: string[] = []

      if (isArray(_keys)) keys = _keys
      else if (isObject(_keys)) keys = Object.keys(_keys)
      else if (!isNull(_keys)) keys = [_keys as string]

      if (_env.isBG) return JSON.parse(localStorage['storage'] || '{}')

      return sendMessageWaitResp('browser-API', {
        type: 'storage-get',
        data: keys,
      })
    },
    set: async (items: Record<string, any>) => {
      const oldData = await sendMessageWaitResp('browser-API', {
        type: 'storage-get',
        data: [],
      })
      const data: Record<string, { oldValue: any; newValue: any }> = {}
      Object.entries(oldData).forEach(([key, val]) => {
        data[key].newValue = val
        data[key].oldValue = val
      })
      Object.entries(items).forEach(([key, val]) => {
        data[key].newValue = val
      })

      if (_env.isBG) {
        const oldData = JSON.parse(localStorage['storage'] || '{}')
        Object.assign(oldData, items)
        localStorage['storage'] = JSON.stringify(oldData)
      } else
        await sendMessageWaitResp('browser-API', {
          type: 'storage-set',
          data: items,
        })

      executeCallback('local-onChanged', data)
    },
    onChanged: {
      addListener: (callback: () => void) =>
        addCallback('local-onChanged', callback),
      removeListener: (callback: () => void) =>
        removeCallback('local-onChanged', callback),
    },
  },
}

export default storage
