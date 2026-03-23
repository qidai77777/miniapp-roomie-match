import {
  createDefaultForm,
  getCurrentMoveInYears,
  getMoveInMonths,
  type HouseType,
  type PreferredRoommateGender,
  type RoomType,
  type RoomieFormData,
} from '../../utils/roomie'
import { ensureLoggedIn, hasCompletedRequiredProfile } from '../../utils/auth'
import { clearForm, loadForm, loadProfile, saveForm } from '../../utils/storage'
import { request } from '../../utils/request'

type StepInfo = {
  title: string
  subtitle: string
  icon: string
}

type SubmitMatchPayload = {
  matchStatus: string
  selfIntroduction: string
  expectedGender: number
  checkinCount: number
  lifestyle: string
  expectedLayout: string
  expectedRoomType: string
  acceptAgencyFee: string
  budgetMin: number
  budgetMax: number
  expectedCheckinDate: string
}

type CurrentMatchRecord = {
  matchStatus?: string
  selfIntroduction?: string
  expectedGender?: number | null
  checkinCount?: number | null
  lifestyle?: string
  expectedLayout?: string
  expectedRoomType?: string
  acceptAgencyFee?: string
  budgetMin?: number | null
  budgetMax?: number | null
  expectedCheckinDate?: string
}

type CurrentMatchResponse = CurrentMatchRecord | null | { code?: number; data?: CurrentMatchRecord | null; msg?: string }

type MatchPreviewData = {
  statusText: string
  introText: string
  genderText: string
  checkinCountText: string
  lifestyleText: string
  layoutText: string
  roomTypeText: string
  agencyFeeText: string
  budgetText: string
  checkinDateText: string
}

type IndexPageData = {
  currentStep: number
  totalSteps: number
  progress: number
  currentStepTitle: string
  currentStepSubtitle: string
  currentStepIcon: string
  isSubmitting: boolean
  isSuccess: boolean
  profileReady: boolean
  hasCurrentMatch: boolean
  matchPreview: MatchPreviewData
  form: RoomieFormData
  shakingFields: Record<string, boolean>
  budgetText: string
  moveInText: string
  houseTypePreview: string
  moveInYears: string[]
  moveInMonths: string[]
  houseTypeOptions: Array<{ value: HouseType; label: string }>
}

const totalSteps = 4
const stepTitles: StepInfo[] = [
  { title: '基本信息', subtitle: '先选择室友偏好和入住人数', icon: '👋' },
  { title: '生活习惯', subtitle: '确认日常作息和相处方式', icon: '🌶' },
  { title: '租房需求', subtitle: '填写预算、户型和入住时间', icon: '🏔' },
  { title: '补充说明', subtitle: '留下自我介绍', icon: '📝' },
]

function getStepInfo(step: number): StepInfo {
  return stepTitles[step - 1] || stepTitles[0]
}

function getProgress(step: number): number {
  return Math.round((step / totalSteps) * 100)
}

function getBudgetText(form: RoomieFormData): string {
  return form.budgetMin && form.budgetMax ? `S$${form.budgetMin} - S$${form.budgetMax}` : '--'
}

function getMoveInText(form: RoomieFormData): string {
  return form.moveInYear && form.moveInMonth ? `${form.moveInYear}年${form.moveInMonth}月` : '--'
}

function hasRequiredProfile(): boolean {
  return hasCompletedRequiredProfile(loadProfile())
}

function mapExpectedGender(value: PreferredRoommateGender): number {
  if (value === 'male') return 1
  if (value === 'female') return 2
  return 0
}

function mapExpectedLayout(value: HouseType): string {
  if (value === 'studio') return 'studio'
  if (value === '1b1b') return '1B1B'
  if (value === '2b1b') return '2B1B'
  if (value === '3b2b') return '3B2B'
  return ''
}

function mapExpectedRoomType(value: RoomType): string {
  if (value === 'master') return '主人房'
  if (value === 'common') return '普通房'
  return '都可以'
}

function getMatchStatusText(status?: string): string {
  if (!status) return '匹配中'

  switch (status) {
    case 'submitted':
      return '匹配中'
    case 'matched':
      return '待确认'
    case 'confirmed':
      return '已确认'
    default:
      return status
  }
}

function buildSubmitPayload(form: RoomieFormData): SubmitMatchPayload {
  return {
    matchStatus: 'submitted',
    selfIntroduction: form.intro.trim(),
    expectedGender: mapExpectedGender(form.preferredRoommateGender),
    checkinCount: Number(form.occupantCount),
    lifestyle: JSON.stringify({
      cleanliness: form.cleanLevel,
      smoking: form.smoke === true ? '吸烟' : '不吸烟',
      drinking: form.drink === true ? '饮酒' : '不饮酒',
      has_visitor: form.hasGuest === true ? '是' : '否',
      visitor_stay:
        form.hasGuest === true ? (form.guestOvernight === true ? '过夜' : '不过夜') : '无访客',
    }),
    expectedLayout: mapExpectedLayout(form.houseType),
    expectedRoomType: mapExpectedRoomType(form.roomType),
    acceptAgencyFee: form.agencyFee === true ? '接受' : '不接受',
    budgetMin: Number(form.budgetMin),
    budgetMax: Number(form.budgetMax),
    expectedCheckinDate: `${form.moveInYear}-${form.moveInMonth.padStart(2, '0')}`,
  }
}

function getCurrentMatchRecord(response: CurrentMatchResponse): CurrentMatchRecord | null {
  if (!response) {
    return null
  }

  let record: CurrentMatchRecord | null

  if (typeof response === 'object' && 'data' in response) {
    record = response.data || null
  } else {
    record = response
  }

  if (!record || Object.keys(record).length === 0) {
    return null
  }

  return record
}

function getGenderText(value?: number | null): string {
  if (value === 1) return '男生'
  if (value === 2) return '女生'
  return '不限'
}

function getLayoutText(value?: string): string {
  if (!value) return '--'
  return value
}

function getRoomTypeText(value?: string): string {
  return value || '--'
}

function getBudgetRangeText(min?: number | null, max?: number | null): string {
  const hasMin = typeof min === 'number'
  const hasMax = typeof max === 'number'

  if (hasMin && hasMax) return `S$${min} - S$${max}`
  if (hasMin) return `S$${min}+`
  if (hasMax) return `<= S$${max}`
  return '--'
}

function getCheckinCountText(value?: number | null): string {
  return typeof value === 'number' ? `${value} 人入住` : '--'
}

function parseLifestyleText(lifestyle?: string): string {
  if (!lifestyle) return '--'

  try {
    const parsed = JSON.parse(lifestyle) as Record<string, string>
    const items = [
      parsed.cleanliness ? `整洁度：${parsed.cleanliness}` : '',
      parsed.smoking ? `吸烟：${parsed.smoking}` : '',
      parsed.drinking ? `饮酒：${parsed.drinking}` : '',
      parsed.has_visitor ? `访客：${parsed.has_visitor}` : '',
      parsed.visitor_stay ? `过夜：${parsed.visitor_stay}` : '',
    ].filter(Boolean)

    return items.length > 0 ? items.join('\n') : '--'
  } catch (error) {
    return lifestyle
  }
}

function createEmptyMatchPreview(): MatchPreviewData {
  return {
    statusText: '',
    introText: '',
    genderText: '',
    checkinCountText: '',
    lifestyleText: '',
    layoutText: '',
    roomTypeText: '',
    agencyFeeText: '',
    budgetText: '',
    checkinDateText: '',
  }
}

function buildMatchPreview(record: CurrentMatchRecord): MatchPreviewData {
  return {
    statusText: getMatchStatusText(record.matchStatus),
    introText: record.selfIntroduction || '',
    genderText: getGenderText(record.expectedGender),
    checkinCountText: getCheckinCountText(record.checkinCount),
    lifestyleText: parseLifestyleText(record.lifestyle),
    layoutText: getLayoutText(record.expectedLayout),
    roomTypeText: getRoomTypeText(record.expectedRoomType),
    agencyFeeText: record.acceptAgencyFee || '--',
    budgetText: getBudgetRangeText(record.budgetMin, record.budgetMax),
    checkinDateText: record.expectedCheckinDate || '--',
  }
}

Page({
  data: {
    currentStep: 1,
    totalSteps,
    progress: getProgress(1),
    currentStepTitle: stepTitles[0].title,
    currentStepSubtitle: stepTitles[0].subtitle,
    currentStepIcon: stepTitles[0].icon,
    isSubmitting: false,
    isSuccess: false,
    profileReady: false,
    hasCurrentMatch: false,
    matchPreview: createEmptyMatchPreview(),
    form: loadForm(),
    shakingFields: {},
    budgetText: '--',
    moveInText: '--',
    houseTypePreview: '--',
    moveInYears: getCurrentMoveInYears(),
    moveInMonths: getMoveInMonths(),
    houseTypeOptions: [
      { value: 'studio', label: 'Studio' },
      { value: '1b1b', label: '1B1B' },
      { value: '2b1b', label: '2B1B' },
      { value: '3b2b', label: '3B2B' },
    ],
  } as IndexPageData,

  async onShow() {
    if (!ensureLoggedIn()) {
      return
    }

    if (!hasRequiredProfile()) {
      wx.redirectTo({ url: '/pages/profile/profile' })
      return
    }

    const form = loadForm()
    this.syncForm(form)
    this.setData({
      profileReady: hasRequiredProfile(),
    })

    await this.fetchCurrentMatch()
  },

  syncForm(form: RoomieFormData) {
    const stepInfo = getStepInfo(this.data.currentStep)
    this.setData({
      form,
      budgetText: getBudgetText(form),
      moveInText: getMoveInText(form),
      houseTypePreview: form.houseType ? form.houseType.toUpperCase() : '--',
      currentStepTitle: stepInfo.title,
      currentStepSubtitle: stepInfo.subtitle,
      currentStepIcon: stepInfo.icon,
      progress: getProgress(this.data.currentStep),
    })
  },

  async fetchCurrentMatch() {
    try {
      const response = await request<CurrentMatchResponse>({
        url: '/roommate-match/current',
        method: 'GET',
      })
      const record = getCurrentMatchRecord(response)

      if (!record) {
        this.setData({
          hasCurrentMatch: false,
          matchPreview: createEmptyMatchPreview(),
        })
        return
      }

      this.setData({
        hasCurrentMatch: true,
        matchPreview: buildMatchPreview(record),
      })
    } catch (error) {
      this.setData({
        hasCurrentMatch: false,
        matchPreview: createEmptyMatchPreview(),
      })
    }
  },

  updateForm(patch: Partial<RoomieFormData>) {
    const form = {
      ...this.data.form,
      ...patch,
    }

    saveForm(form)
    this.syncForm(form)
  },

  setStep(step: number) {
    const stepInfo = getStepInfo(step)
    this.setData({
      currentStep: step,
      currentStepTitle: stepInfo.title,
      currentStepSubtitle: stepInfo.subtitle,
      currentStepIcon: stepInfo.icon,
      progress: getProgress(step),
    })
    wx.pageScrollTo({ scrollTop: 0, duration: 250 })
  },

  canProceed(step = this.data.currentStep): boolean {
    const form = this.data.form

    if (step === 1) {
      return form.preferredRoommateGender !== '' && form.occupantCount !== ''
    }

    if (step === 2) {
      return (
        form.cleanLevel !== '' &&
        form.smoke !== null &&
        form.drink !== null &&
        form.hasGuest !== null &&
        (form.hasGuest === false || form.guestOvernight !== null)
      )
    }

    if (step === 3) {
      return (
        form.houseType !== '' &&
        form.roomType !== '' &&
        form.budgetMin !== '' &&
        form.budgetMax !== '' &&
        form.moveInYear !== '' &&
        form.moveInMonth !== '' &&
        form.agencyFee !== null
      )
    }

    if (step === 4) {
      return form.intro.trim().length >= 10
    }

    return false
  },

  shakeField(field: string) {
    this.setData({
      [`shakingFields.${field}`]: true,
    })
    setTimeout(() => {
      this.setData({
        [`shakingFields.${field}`]: false,
      })
    }, 600)
  },

  shakeEmpty() {
    const form = this.data.form
    const step = this.data.currentStep

    if (step === 1) {
      if (!form.preferredRoommateGender) this.shakeField('preferredRoommateGender')
      if (!form.occupantCount) this.shakeField('occupantCount')
      return
    }

    if (step === 2) {
      if (!form.cleanLevel) this.shakeField('cleanLevel')
      if (form.smoke === null) this.shakeField('smoke')
      if (form.drink === null) this.shakeField('drink')
      if (form.hasGuest === null) this.shakeField('hasGuest')
      if (form.hasGuest === true && form.guestOvernight === null) this.shakeField('guestOvernight')
      return
    }

    if (step === 3) {
      if (!form.houseType) this.shakeField('houseType')
      if (!form.roomType) this.shakeField('roomType')
      if (!form.budgetMin || !form.budgetMax) this.shakeField('budget')
      if (!form.moveInYear || !form.moveInMonth) this.shakeField('moveIn')
      if (form.agencyFee === null) this.shakeField('agencyFee')
      return
    }

    if (form.intro.trim().length < 10) this.shakeField('intro')
  },

  nextStep() {
    if (this.data.currentStep >= this.data.totalSteps) return
    if (!this.canProceed()) {
      this.shakeEmpty()
      return
    }
    this.setStep(this.data.currentStep + 1)
  },

  prevStep() {
    if (this.data.currentStep <= 1) return
    this.setStep(this.data.currentStep - 1)
  },

  selectPreferredGender(e: WechatMiniprogram.BaseEvent<{ value: PreferredRoommateGender }>) {
    this.updateForm({ preferredRoommateGender: e.currentTarget.dataset.value })
  },

  selectOccupantCount(e: WechatMiniprogram.BaseEvent<{ value: '1' | '2' }>) {
    this.updateForm({ occupantCount: e.currentTarget.dataset.value })
  },

  selectCleanLevel(e: WechatMiniprogram.BaseEvent<{ value: RoomieFormData['cleanLevel'] }>) {
    this.updateForm({ cleanLevel: e.currentTarget.dataset.value })
  },

  selectSmoke(e: WechatMiniprogram.BaseEvent<{ value: 'true' | 'false' }>) {
    this.updateForm({ smoke: e.currentTarget.dataset.value === 'true' })
  },

  selectDrink(e: WechatMiniprogram.BaseEvent<{ value: 'true' | 'false' }>) {
    this.updateForm({ drink: e.currentTarget.dataset.value === 'true' })
  },

  selectHasGuest(e: WechatMiniprogram.BaseEvent<{ value: 'true' | 'false' }>) {
    const hasGuest = e.currentTarget.dataset.value === 'true'
    this.updateForm({ hasGuest, guestOvernight: null })
  },

  selectGuestOvernight(e: WechatMiniprogram.BaseEvent<{ value: 'true' | 'false' }>) {
    this.updateForm({ guestOvernight: e.currentTarget.dataset.value === 'true' })
  },

  selectHouseType(e: WechatMiniprogram.BaseEvent<{ value: HouseType }>) {
    this.updateForm({ houseType: e.currentTarget.dataset.value })
  },

  selectRoomType(e: WechatMiniprogram.BaseEvent<{ value: RoomType }>) {
    this.updateForm({ roomType: e.currentTarget.dataset.value })
  },

  selectAgencyFee(e: WechatMiniprogram.BaseEvent<{ value: 'true' | 'false' }>) {
    this.updateForm({ agencyFee: e.currentTarget.dataset.value === 'true' })
  },

  onBudgetMinInput(e: WechatMiniprogram.Input) {
    this.updateForm({ budgetMin: e.detail.value.replace(/[^\d]/g, '').slice(0, 5) })
  },

  onBudgetMaxInput(e: WechatMiniprogram.Input) {
    this.updateForm({ budgetMax: e.detail.value.replace(/[^\d]/g, '').slice(0, 5) })
  },

  onMoveInYearChange(e: WechatMiniprogram.PickerChange) {
    this.updateForm({ moveInYear: this.data.moveInYears[Number(e.detail.value)] || '' })
  },

  onMoveInMonthChange(e: WechatMiniprogram.PickerChange) {
    this.updateForm({ moveInMonth: this.data.moveInMonths[Number(e.detail.value)] || '' })
  },

  onIntroInput(e: WechatMiniprogram.Input) {
    this.updateForm({ intro: e.detail.value.slice(0, 300) })
  },

  async handleSubmit() {
    if (this.data.isSubmitting) return
    if (!this.canProceed(4)) {
      this.shakeEmpty()
      return
    }

    if (!hasRequiredProfile()) {
      wx.showModal({
        title: '请先完善资料',
        content: '请先在个人中心填写必填资料：性别、学校和微信号。',
        showCancel: false,
      })
      return
    }

    this.setData({
      isSubmitting: true,
      profileReady: true,
    })

    try {
      const payload = buildSubmitPayload(this.data.form)

      await request<boolean | { code?: number; data?: boolean; msg?: string }, SubmitMatchPayload>({
        url: '/roommate-match/submit',
        method: 'POST',
        data: payload,
      })

      this.setData({
        isSubmitting: false,
        isSuccess: true,
      })

      console.info('室友匹配提交成功', {
        payload,
        form: this.data.form,
        profile: loadProfile(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败，请稍后重试'
      this.setData({
        isSubmitting: false,
      })
      wx.showToast({
        title: message,
        icon: 'none',
      })
    }
  },

  resetForm() {
    const form = createDefaultForm()
    clearForm()
    saveForm(form)
    this.setData({
      isSuccess: false,
      currentStep: 1,
      shakingFields: {},
    })
    this.syncForm(form)
  },

  handleRewrite() {
    this.setData({
      hasCurrentMatch: false,
    })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  goProfile() {
    wx.redirectTo({ url: '/pages/profile/profile' })
  },
})
