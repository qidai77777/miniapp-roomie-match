import { envConfig } from './config/env'
import { getAuthSession } from './utils/auth'

App<IAppOption>({
  globalData: {
    env: envConfig,
    authSession: getAuthSession(),
  },
  onLaunch() {
    console.info('当前接口配置', envConfig)
  },
})
