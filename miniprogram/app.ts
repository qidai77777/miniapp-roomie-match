import { envConfig } from './config/env'
import { getAuthSession } from './utils/auth'

App<IAppOption>({
  globalData: {
    env: envConfig,
    authSession: getAuthSession(),
  },
  onLaunch() {
    console.info(`当前环境: ${envConfig.label}`, envConfig)
  },
})
