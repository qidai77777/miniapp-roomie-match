import {
  createDefaultForm,
  getCurrentMoveInYears,
  getMoveInMonths,
  type HouseType,
  type PreferredRoommateGender,
  type RoomType,
  type RoomieFormData,
} from '../../utils/roomie'
import { ensureLoggedIn } from '../../utils/auth'
import { clearForm, loadForm, loadProfile, saveForm } from '../../utils/storage'

type StepInfo = {
  title: string
  subtitle: string
  icon: string
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
  { title: '生活习惯', subtitle: '确认日常作息和相处方式', icon: '🌿' },
  { title: '租房需求', subtitle: '填写预算、房型和入住时间', icon: '🏠' },
  { title: '补充说明', subtitle: '留下自我介绍', icon: '📝' },
]

function getStepInfo(step: number): StepInfo {
  return stepTitles[step - 1] || stepTitles[0]
}

function getProgress(step: number): number {
  return Math.round((step / totalSteps) * 100)
}

function getBudgetText(form: RoomieFormData): string {
  return form.budgetMin && form.budgetMax ? `S$${form.budgetMin} - S$${form.budgetMax}` : '—'
}

function getMoveInText(form: RoomieFormData): string {
  return form.moveInYear && form.moveInMonth ? `${form.moveInYear}年${form.moveInMonth}月` : '—'
}

function hasRequiredProfile(): boolean {
  const profile = loadProfile()
  return profile.gender !== '' && profile.school.trim() !== '' && profile.wechat.trim() !== ''
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
    form: loadForm(),
    shakingFields: {},
    budgetText: '—',
    moveInText: '—',
    houseTypePreview: '—',
    moveInYears: getCurrentMoveInYears(),
    moveInMonths: getMoveInMonths(),
    houseTypeOptions: [
      { value: 'studio', label: 'Studio' },
      { value: '1b1b', label: '1B1B' },
      { value: '2b1b', label: '2B1B' },
      { value: '3b2b', label: '3B2B' },
    ],
  } as IndexPageData,

  onShow() {
    if (!ensureLoggedIn()) {
      return
    }

    const form = loadForm()
    this.syncForm(form)
    this.setData({
      profileReady: hasRequiredProfile(),
    })
  },

  syncForm(form: RoomieFormData) {
    const stepInfo = getStepInfo(this.data.currentStep)
    this.setData({
      form,
      budgetText: getBudgetText(form),
      moveInText: getMoveInText(form),
      houseTypePreview: form.houseType ? form.houseType.toUpperCase() : '—',
      currentStepTitle: stepInfo.title,
      currentStepSubtitle: stepInfo.subtitle,
      currentStepIcon: stepInfo.icon,
      progress: getProgress(this.data.currentStep),
    })
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

  handleSubmit() {
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

    setTimeout(() => {
      this.setData({
        isSubmitting: false,
        isSuccess: true,
      })

      console.log('提交数据:', {
        ...this.data.form,
        profile: loadProfile(),
      })
    }, 1800)
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

  goProfile() {
    wx.redirectTo({ url: '/pages/profile/profile' })
  },
})
