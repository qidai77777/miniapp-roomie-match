import { envConfig, isFullUrl } from '../config/env'
import { clearAuthSession, loadAuthSession } from './storage'

type RequestMethod = 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT'

export type RequestOptions<TData = WechatMiniprogram.IAnyObject> = {
  url: string
  method?: RequestMethod
  data?: TData
  header?: WechatMiniprogram.IAnyObject
  timeout?: number
}

type ApiErrorResponse = {
  code?: number
  msg?: string
}

let isRedirectingToLogin = false

function buildUrl(url: string): string {
  if (isFullUrl(url)) {
    return url
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`
  return `${envConfig.baseUrl}${normalizedPath}`
}

function handleUnauthorized() {
  clearAuthSession()

  if (isRedirectingToLogin) {
    return
  }

  isRedirectingToLogin = true

  wx.reLaunch({
    url: '/pages/login/login',
    complete: () => {
      setTimeout(() => {
        isRedirectingToLogin = false
      }, 300)
    },
  })
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
        const apiData = data as ApiErrorResponse | TResponse

        if (statusCode === 401) {
          handleUnauthorized()
          reject(new Error('登录已过期，请重新登录'))
          return
        }

        if (statusCode >= 200 && statusCode < 300) {
          if (
            typeof apiData === 'object' &&
            apiData !== null &&
            'code' in apiData &&
            (apiData as ApiErrorResponse).code === 401
          ) {
            handleUnauthorized()
            reject(
              new Error((apiData as ApiErrorResponse).msg || '登录已过期，请重新登录'),
            )
            return
          }

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
