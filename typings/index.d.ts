/// <reference path="./types/index.d.ts" />

type EnvConfig = {
  baseUrl: string
}

type AuthSession = {
  token: string
  openId: string
  userId: string
  nickName: string
  avatarUrl: string
  expiresAt: number | null
}

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    env: EnvConfig,
    authSession: AuthSession,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}
