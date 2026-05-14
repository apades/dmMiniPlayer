import { defineClient } from '../../define-client'

export const visibilityClient = defineClient({
  name: 'visibility',
  setup: (ctx) => {
    return {
      alwaysVisible() {
        return ctx.send('alwaysVisible')
      },
      alwaysHidden() {
        return ctx.send('alwaysHidden')
      },
      restore() {
        return ctx.send('restore')
      },
    }
  },
})
