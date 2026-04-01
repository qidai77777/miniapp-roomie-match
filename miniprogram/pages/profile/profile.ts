import {
  getProfileGenderText,
  getSchoolDisplayName,
  schoolOptions,
  type ProfileData,
  type ProfileGender,
  type SchoolOption,
} from '../../utils/roomie'
import { ensureLoggedIn, fetchCurrentUserProfile, getAuthSession } from '../../utils/auth'
import { loadProfile, saveProfile } from '../../utils/storage'
import { request } from '../../utils/request'

let hasPendingSync = false
let isSyncing = false

type ProfilePageData = {
  profile: ProfileData
  schoolOptions: readonly SchoolOption[]
  genderText: string
  missingText: string
  hasRequiredProfile: boolean
  schoolDisplayText: string
  showServiceQrModal: boolean
  serviceQrImageUrl: string
  serviceWechatId: string
}

type UpdateProfilePayload = {
  id: string
  nickname: string
  avatar: string
  gender?: number
  age?: number
  school?: string
  wxNumber?: string
}

function computeState(profile: ProfileData) {
  const isGenderComplete = profile.gender !== ''
  const isSchoolComplete = profile.school.trim() !== ''
  const isWechatComplete = profile.wechat.trim() !== ''
  const missing: string[] = []

  if (!isGenderComplete) missing.push('性别')
  if (!isSchoolComplete) missing.push('学校')
  if (!isWechatComplete) missing.push('微信号')

  return {
    genderText: getProfileGenderText(profile.gender),
    missingText: missing.join('、'),
    hasRequiredProfile: isGenderComplete && isSchoolComplete && isWechatComplete,
    schoolDisplayText: profile.school ? getSchoolDisplayName(profile.school) : '',
  }
}

const serviceQrImageUrl = '/assets/images/erweima.png'
const serviceWechatId = 'sgzuzhu'

Page({
  data: {
    profile: loadProfile(),
    schoolOptions,
    genderText: '未设置',
    missingText: '',
    hasRequiredProfile: false,
    schoolDisplayText: '',
    showServiceQrModal: false,
    serviceQrImageUrl,
    serviceWechatId,
  } as ProfilePageData,

  onShow() {
    if (!ensureLoggedIn()) {
      return
    }

    this.syncProfile(loadProfile())
    void this.refreshProfileFromServer()
  },

  onHide() {
    void this.syncProfileOnLeave()
  },

  onUnload() {
    void this.syncProfileOnLeave()
  },

  syncProfile(profile: ProfileData) {
    const state = computeState(profile)
    this.setData({
      profile,
      ...state,
    })
  },

  updateProfile(patch: Partial<ProfileData>) {
    const profile = {
      ...this.data.profile,
      ...patch,
    }

    saveProfile(profile)
    this.syncProfile(profile)
    hasPendingSync = true
  },

  async syncProfileOnLeave() {
    if (!hasPendingSync || isSyncing) {
      return
    }

    isSyncing = true

    try {
      const session = getAuthSession()

      if (!session.userId) {
        throw new Error('登录态中缺少 userId，无法更新个人信息')
      }

      const profile = loadProfile()

      await request<boolean, UpdateProfilePayload>({
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

      hasPendingSync = false
      await this.refreshProfileFromServer()
    } catch (error) {
      const message = error instanceof Error ? error.message : '个人资料同步失败'
      wx.showToast({
        title: message,
        icon: 'none',
      })
    } finally {
      isSyncing = false
    }
  },

  async refreshProfileFromServer() {
    try {
      await fetchCurrentUserProfile()
      this.syncProfile(loadProfile())
    } catch {
      // Keep local cache when remote fetch fails.
    }
  },

  selectGender(e: WechatMiniprogram.BaseEvent<{ value: ProfileGender }>) {
    this.updateProfile({ gender: e.currentTarget.dataset.value })
  },

  onAgeInput(e: WechatMiniprogram.Input) {
    this.updateProfile({ age: e.detail.value.replace(/[^\d]/g, '').slice(0, 2) })
  },

  onSchoolChange(e: WechatMiniprogram.PickerChange) {
    const index = Number(e.detail.value)
    const selected = this.data.schoolOptions[index]
    this.updateProfile({ school: selected ? selected.value : '' })
  },

  onWechatInput(e: WechatMiniprogram.Input) {
    this.updateProfile({ wechat: e.detail.value.trim() })
  },

  onNicknameInput(e: WechatMiniprogram.Input) {
    this.updateProfile({ nickName: e.detail.value.trim() })
  },

  openServiceQrModal() {
    this.setData({
      showServiceQrModal: true,
    })
  },

  closeServiceQrModal() {
    this.setData({
      showServiceQrModal: false,
    })
  },

  copyServiceWechat() {
    void wx.setClipboardData({
      data: this.data.serviceWechatId,
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success',
        })
      },
    })
  },

  noop() {},

  goHome() {
    void this.syncProfileOnLeave()
    wx.redirectTo({ url: '/pages/index/index' })
  },
})
