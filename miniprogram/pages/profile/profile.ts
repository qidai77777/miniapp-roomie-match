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
import { validateRequiredProfile, showProfileIncompleteToast, validateAge, showAgeWarning } from '../../utils/validation'

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

      // 使用当前页面的最新数据
      const profile = this.data.profile

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
      // 保存成功后不立即刷新，让跳转后的页面去刷新
      // await this.refreshProfileFromServer()
      
      // 保存成功后，检查必填字段是否完整，如果不完整给出提示
      const validation = validateRequiredProfile(this.data.profile)
      if (!validation.isValid) {
        showProfileIncompleteToast(validation.missingText)
      }
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
    const ageStr = e.detail.value.replace(/[^\d]/g, '').slice(0, 2)
    const age = Number(ageStr)

    // 使用工具类检查年龄
    if (ageStr && age > 0 && !validateAge(age)) {
      showAgeWarning()
    }

    this.updateProfile({ age: ageStr })
  },

  onSchoolChange(e: WechatMiniprogram.PickerChange) {
    const index = Number(e.detail.value)
    const selected = this.data.schoolOptions[index]
    this.updateProfile({ school: selected ? selected.value : '' })
  },

  onWechatInput(e: WechatMiniprogram.Input) {
    this.updateProfile({ wechat: e.detail.value.trim() })
  },

  onNicknameSubmit(e: WechatMiniprogram.FormSubmit) {
    // type="nickname" 的输入框必须通过 form 提交来获取值
    const nickname = e.detail.value.nickname || ''
    const trimmedNickname = nickname.trim()
    
    if (trimmedNickname) {
      this.updateProfile({ nickName: trimmedNickname })
      wx.showToast({
        title: '昵称已保存',
        icon: 'success',
      })
    } else {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none',
      })
    }
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

  async goHome() {
    // 使用工具类检查必填字段
    const validation = validateRequiredProfile()
    
    if (!validation.isValid) {
      const result = await wx.showModal({
        title: '资料未完善',
        content: `${validation.missingText}尚未填写，这些信息是进行室友匹配的必填项。确定要离开吗？`,
        confirmText: '继续填写',
        cancelText: '暂时离开',
      })

      if (result.confirm) {
        // 用户选择继续填写，不跳转
        return
      }
    }

    // 尝试同步数据
    await this.syncProfileOnLeave()
    wx.redirectTo({ url: '/pages/index/index' })
  },
})
