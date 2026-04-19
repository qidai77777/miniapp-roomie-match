import { envConfig, isFullUrl } from '../config/env'
import { clearAuthSession, loadAuthSession } from './storage'

const HOME_PAGE_PATH = '/pages/index/index'
const AUTH_LOGIN_PAGE_PATH = '/pages/auth-login/auth-login'

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

let isRedirectingToHome = false

function buildUrl(url: string): string {
  if (isFullUrl(url)) {
    return url
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`
  return `${envConfig.baseUrl}${normalizedPath}`
}

function handleUnauthorized() {
  clearAuthSession()

  if (isRedirectingToHome) {
    return
  }

  isRedirectingToHome = true

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const currentRoute = currentPage ? `/${currentPage.route}` : HOME_PAGE_PATH
  const currentOptions = currentPage ? currentPage.options || {} : {}
  const queryString = Object.keys(currentOptions)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(currentOptions[key])}`)
    .join('&')
  const redirectPath =
    currentRoute && currentRoute !== AUTH_LOGIN_PAGE_PATH
      ? `${currentRoute}${queryString ? `?${queryString}` : ''}`
      : HOME_PAGE_PATH

  wx.reLaunch({
    url: `${AUTH_LOGIN_PAGE_PATH}?redirect=${encodeURIComponent(redirectPath)}`,
    complete: () => {
      setTimeout(() => {
        isRedirectingToHome = false
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
