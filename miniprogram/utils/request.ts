import { envConfig, isFullUrl } from '../config/env'
import { loadAuthSession } from './storage'

type RequestMethod = 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT'

export type RequestOptions<TData = WechatMiniprogram.IAnyObject> = {
  url: string
  method?: RequestMethod
  data?: TData
  header?: WechatMiniprogram.IAnyObject
  timeout?: number
}

function buildUrl(url: string): string {
  if (isFullUrl(url)) {
    return url
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`
  return `${envConfig.baseUrl}${normalizedPath}`
}

export function request<TResponse, TData = WechatMiniprogram.IAnyObject>(
  options: RequestOptions<TData>,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    const requestUrl = buildUrl(options.url)
    const { token } = loadAuthSession()

    wx.request({
      url: requestUrl,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { token } : {}),
        ...options.header,
      },
      timeout: options.timeout || 10000,
      success: (response) => {
        const { statusCode, data } = response

        if (statusCode >= 200 && statusCode < 300) {
          resolve(data as TResponse)
          return
        }

        reject(new Error(`请求失败: ${options.method || 'GET'} ${requestUrl}，状态码 ${statusCode}`))
      },
      fail: (error) => {
        reject(error)
      },
    })
  })
}
