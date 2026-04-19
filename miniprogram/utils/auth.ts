import { request } from './request'
import { clearAuthSession, loadAuthSession, loadProfile, saveAuthSession, saveProfile } from './storage'
import {
  normalizeSchoolValue,
  type AuthSession,
  type ProfileData,
} from './roomie'

const LOGIN_API_PATH = '/user/wx-login'
export const HOME_PAGE_PATH = '/pages/index/index'
export const AUTH_LOGIN_PAGE_PATH = '/pages/auth-login/auth-login'

type LoginApiPayload = {
  code: string
}

type LoginApiResponse = {
  token?: string
  accessToken?: string
  openId?: string
  userId?: string | number
  expiresIn?: number
  data?: LoginApiResponse
}

type UpdateUserProfilePayload = {
  id: string
  nickname: string
  avatar: string
}

type UserProfileResponse = {
  id?: string | number
  avatar?: string
  gender?: number
  nickname?: string
  age?: number
  school?: string
  wxNumber?: string
  data?: UserProfileResponse
}

function wxCodeLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
          return
        }

        reject(new Error('微信登录失败，未获取到 code'))
      },
      fail: reject,
    })
  })
}

function parseLoginResponse(response: LoginApiResponse): AuthSession {
  const source = response.data || response
  const token = source.token || source.accessToken || ''
  const expiresAt = source.expiresIn ? Date.now() + source.expiresIn * 1000 : null

  if (!token) {
    throw new Error('登录接口未返回 token，请确认后端返回结构')
  }

  return {
    token,
    openId: source.openId || '',
    userId: source.userId ? String(source.userId) : '',
    nickName: '',
    avatarUrl: '',
    expiresAt,
  }
}

export function getAuthSession(): AuthSession {
  return loadAuthSession()
}

export function isLoggedIn(): boolean {
  const session = loadAuthSession()

  if (!session.token) {
    return false
  }

  if (session.expiresAt && session.expiresAt <= Date.now()) {
    clearAuthSession()
    return false
  }

  return true
}

export async function login(): Promise<AuthSession> {
  const code = await wxCodeLogin()
  const response = await request<LoginApiResponse, LoginApiPayload>({
    url: LOGIN_API_PATH,
    method: 'POST',
    data: { code },
  })

  const session = parseLoginResponse(response)
  saveAuthSession(session)
  return session
}

export function logout() {
  clearAuthSession()
}

export function hasCompletedRequiredProfile(profile?: ProfileData): boolean {
  const currentProfile = profile || loadProfile()
  return (
    currentProfile.gender !== '' &&
    currentProfile.school.trim() !== '' &&
    currentProfile.wechat.trim() !== ''
  )
}

export async function syncUserProfile(profile: {
  nickName: string
  avatarUrl: string
}): Promise<void> {
  const session = loadAuthSession()

  if (!session.userId) {
    throw new Error('登录态中缺少 userId，无法更新个人信息')
  }

  await request<boolean, UpdateUserProfilePayload>({
    url: '/user/profile',
    method: 'PUT',
    data: {
      id: session.userId,
      nickname: profile.nickName.trim(),
      avatar: profile.avatarUrl.trim(),
    },
  })
}

export async function updateCurrentUserProfile(profile: ProfileData): Promise<void> {
  const session = loadAuthSession()

  if (!session.userId) {
    throw new Error('登录态中缺少 userId，无法更新个人信息')
  }

  await request<
    boolean,
    UpdateUserProfilePayload & {
      gender?: number
      age?: number
      school?: string
      wxNumber?: string
    }
  >({
    url: '/user/profile',
    method: 'PUT',
    data: {
      id: session.userId,
      nickname: profile.nickName.trim(),
      avatar: profile.avatarUrl.trim(),
      gender: profile.gender === 'male' ? 1 : profile.gender === 'female' ? 2 : undefined,
      age: profile.age.trim() ? Number(profile.age) : undefined,
      school: profile.school.trim() || undefined,
      wxNumber: profile.wechat.trim() || undefined,
    },
  })
}

export async function fetchCurrentUserProfile(): Promise<AuthSession> {
  const response = await request<UserProfileResponse>({
    url: '/user/profile',
    method: 'GET',
  })

  const source = response.data || response
  const session = loadAuthSession()
  const nextSession: AuthSession = {
    ...session,
    userId: source.id !== undefined && source.id !== null ? String(source.id) : session.userId,
    nickName: typeof source.nickname === 'string' ? source.nickname : session.nickName,
    avatarUrl: typeof source.avatar === 'string' ? source.avatar : session.avatarUrl,
  }

  saveAuthSession(nextSession)
  saveProfile({
    nickName: typeof source.nickname === 'string' ? source.nickname : session.nickName,
    avatarUrl: typeof source.avatar === 'string' ? source.avatar : session.avatarUrl,
    gender: source.gender === 1 ? 'male' : source.gender === 2 ? 'female' : '',
    age: typeof source.age === 'number' ? String(source.age) : '',
    school: typeof source.school === 'string' ? normalizeSchoolValue(source.school) : '',
    wechat: typeof source.wxNumber === 'string' ? source.wxNumber : '',
  })

  return nextSession
}

export function buildAuthLoginUrl(redirectPath = HOME_PAGE_PATH): string {
  const normalizedRedirectPath =
    redirectPath && redirectPath !== AUTH_LOGIN_PAGE_PATH ? redirectPath : HOME_PAGE_PATH

  return `${AUTH_LOGIN_PAGE_PATH}?redirect=${encodeURIComponent(normalizedRedirectPath)}`
}

export function ensureLoggedIn(options?: {
  redirect?: boolean
  redirectPath?: string
}): boolean {
  if (isLoggedIn()) {
    return true
  }

  if (!options || options.redirect !== false) {
    const redirectPath = options && options.redirectPath ? options.redirectPath : HOME_PAGE_PATH
    wx.reLaunch({ url: buildAuthLoginUrl(redirectPath) })
  }

  return false
}
