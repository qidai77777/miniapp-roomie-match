import { envConfig } from '../../config/env'
import {
  getAuthSession,
  hasCompletedRequiredProfile,
  hasUserProfile,
  fetchCurrentUserProfile,
  isLoggedIn,
  login,
  resolveLoginSuccessPath,
  syncUserProfile,
  updateAuthSessionProfile,
} from '../../utils/auth'

type LoginPageData = {
  loading: boolean
  needsProfile: boolean
  errorMessage: string
  envLabel: string
  nickName: string
  avatarUrl: string
}

Page({
  data: {
    loading: false,
    needsProfile: false,
    errorMessage: '',
    envLabel: envConfig.label,
    nickName: '',
    avatarUrl: '',
  } as LoginPageData,

  onLoad() {
    void this.restoreSessionOrLogin()
  },

  async restoreSessionOrLogin() {
    if (!isLoggedIn()) {
      await this.startLogin()
      return
    }

    let session = getAuthSession()
    getApp<IAppOption>().globalData.authSession = session

    if (hasUserProfile(session)) {
      try {
        session = await fetchCurrentUserProfile()
        getApp<IAppOption>().globalData.authSession = session
      } catch {
        // Keep cached profile when remote refresh fails.
      }

      wx.reLaunch({ url: resolveLoginSuccessPath() })
      return
    }

    if (hasCompletedRequiredProfile()) {
      wx.reLaunch({ url: resolveLoginSuccessPath() })
      return
    }

    this.enterProfileStep(session)
  },

  async startLogin() {
    if (this.data.loading) {
      return
    }

    this.setData({
      loading: true,
      needsProfile: false,
      errorMessage: '',
    })

    try {
      const session = await login()
      getApp<IAppOption>().globalData.authSession = session
      this.enterProfileStep(session)
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败，请稍后重试'
      this.setData({
        loading: false,
        needsProfile: false,
        errorMessage: message,
      })
    }
  },

  enterProfileStep(session: IAppOption['globalData']['authSession']) {
    this.setData({
      loading: false,
      needsProfile: true,
      errorMessage: '',
      nickName: session.nickName,
      avatarUrl: session.avatarUrl,
    })
  },

  handleGetUserProfile() {
    if (this.data.loading) {
      return
    }

    this.setData({
      loading: true,
      errorMessage: '',
    })

    wx.getUserProfile({
      desc: '用于完善头像和昵称',
      success: async (res) => {
        console.info('微信用户资料', {
          nickName: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl,
          userInfo: res.userInfo,
        })

        try {
          const profile = {
            nickName: res.userInfo.nickName,
            avatarUrl: res.userInfo.avatarUrl,
          }

          await syncUserProfile(profile)
          updateAuthSessionProfile(profile)
          const session = await fetchCurrentUserProfile()
          getApp<IAppOption>().globalData.authSession = session
          wx.reLaunch({ url: resolveLoginSuccessPath() })
        } catch (error) {
          const message = error instanceof Error ? error.message : '同步头像和昵称失败，请重试'
          this.setData({
            loading: false,
            errorMessage: message,
          })
        }
      },
      fail: (error) => {
        this.setData({
          loading: false,
          errorMessage: error.errMsg || '获取头像和昵称失败，请重试',
        })
      },
    })
  },

  handleRetry() {
    void this.startLogin()
  },
})
