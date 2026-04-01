export type AppEnv = 'development' | 'production'

export type EnvConfig = {
  name: AppEnv
  label: string
  baseUrl: string
}

const ENV_CONFIG_MAP: Record<AppEnv, EnvConfig> = {
  development: {
    name: 'development',
    label: '开发环境',
    // baseUrl: 'http://42.194.162.221',
    baseUrl: 'http://127.0.0.1:8080',
  },
  production: {
    name: 'production',
    label: '生产环境',
    baseUrl: 'http://42.194.162.221',
  },
}

function resolveAppEnv(): AppEnv {
  try {
    const { miniProgram } = wx.getAccountInfoSync()
    return miniProgram.envVersion === 'develop' ? 'development' : 'production'
  } catch (error) {
    console.warn('读取小程序环境失败，默认使用开发环境', error)
    return 'development'
  }
}

export const appEnv = resolveAppEnv()

export const envConfig = ENV_CONFIG_MAP[appEnv]

export function isFullUrl(url: string): boolean {
  return /^https?:\/\//.test(url)
}
