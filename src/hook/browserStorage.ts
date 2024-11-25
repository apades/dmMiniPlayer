import {
  useBrowserLocalStorage,
  useBrowserSyncStorage,
} from '@root/utils/storage'
import { useOnce } from '.'

export const useReactBrowserLocalStorage = ((key, callback) => {
  useOnce(() => {
    return useBrowserLocalStorage(key, callback)
  })
}) as typeof useBrowserLocalStorage

export const useReactBrowserSyncStorage = ((key, callback) => {
  useOnce(() => {
    return useBrowserSyncStorage(key, callback)
  })
}) as typeof useBrowserSyncStorage
