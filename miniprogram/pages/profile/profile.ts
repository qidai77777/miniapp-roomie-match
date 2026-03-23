import {
  getProfileGenderText,
  schoolOptions,
  type ProfileData,
  type ProfileGender,
} from '../../utils/roomie'
import { loadProfile, saveProfile } from '../../utils/storage'

type ProfilePageData = {
  profile: ProfileData
  schoolOptions: readonly string[]
  genderText: string
  missingText: string
  hasRequiredProfile: boolean
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
  }
}

Page({
  data: {
    profile: loadProfile(),
    schoolOptions,
    genderText: '未设置',
    missingText: '',
    hasRequiredProfile: false,
  } as ProfilePageData,

  onShow() {
    const profile = loadProfile()
    this.syncProfile(profile)
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
  },

  selectGender(e: WechatMiniprogram.BaseEvent<{ value: ProfileGender }>) {
    this.updateProfile({ gender: e.currentTarget.dataset.value })
  },

  onAgeInput(e: WechatMiniprogram.Input) {
    this.updateProfile({ age: e.detail.value.replace(/[^\d]/g, '').slice(0, 2) })
  },

  onSchoolChange(e: WechatMiniprogram.PickerChange) {
    const index = Number(e.detail.value)
    this.updateProfile({ school: this.data.schoolOptions[index] || '' })
  },

  onWechatInput(e: WechatMiniprogram.Input) {
    this.updateProfile({ wechat: e.detail.value.trim() })
  },

  goHome() {
    wx.redirectTo({ url: '/pages/index/index' })
  },
})
