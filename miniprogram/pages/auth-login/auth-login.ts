import {
  AUTH_LOGIN_PAGE_PATH,
  fetchCurrentUserProfile,
  HOME_PAGE_PATH,
  isLoggedIn,
  login,
} from '../../utils/auth'

type AuthLoginPageData = {
  isSubmitting: boolean
  redirectPath: string
  agreedToTerms: boolean
}

function normalizeRedirectPath(path?: string): string {
  if (!path) return HOME_PAGE_PATH
  if (path === AUTH_LOGIN_PAGE_PATH || path.includes(AUTH_LOGIN_PAGE_PATH)) {
    return HOME_PAGE_PATH
  }
  return path
}

Page({
  data: {
    isSubmitting: false,
    redirectPath: HOME_PAGE_PATH,
    agreedToTerms: false,
  } as AuthLoginPageData,

  onLoad(options?: Record<string, string>) {
    const redirectPath = normalizeRedirectPath(
      options && options.redirect ? decodeURIComponent(options.redirect) : undefined,
    )

    this.setData({
      redirectPath,
    })
  },

  onShow() {
    if (!isLoggedIn()) {
      return
    }

    wx.reLaunch({ url: this.data.redirectPath || HOME_PAGE_PATH })
  },

  toggleAgreement() {
    this.setData({
      agreedToTerms: !this.data.agreedToTerms,
    })
  },

  viewUserAgreement() {
    wx.navigateTo({ url: '/pages/user-agreement/user-agreement' })
  },

  viewPrivacyPolicy() {
    wx.navigateTo({ url: '/pages/privacy-policy/privacy-policy' })
  },

  async handleLogin() {
    if (this.data.isSubmitting) return

    if (!this.data.agreedToTerms) {
      wx.showToast({
        title: '请先阅读并同意用户协议和隐私政策',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    this.setData({ isSubmitting: true })

    try {
      await login()

      await fetchCurrentUserProfile()

      wx.showToast({
        title: '登录成功',
        icon: 'success',
      })

      setTimeout(() => {
        wx.reLaunch({ url: this.data.redirectPath || HOME_PAGE_PATH })
      }, 200)
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败，请稍后重试'
      wx.showToast({
        title: message,
        icon: 'none',
      })
    } finally {
      this.setData({ isSubmitting: false })
    }
  },

  goHome() {
    wx.reLaunch({ url: HOME_PAGE_PATH })
  },
})
