import { loadProfile, type ProfileData } from './storage'

/**
 * 校验结果
 */
export type ValidationResult = {
  isValid: boolean
  missingFields: string[]
  missingText: string
}

/**
 * 检查个人资料必填字段是否完整
 */
export function validateRequiredProfile(profile?: ProfileData): ValidationResult {
  const currentProfile = profile || loadProfile()
  
  const isGenderComplete = currentProfile.gender !== ''
  const isSchoolComplete = currentProfile.school.trim() !== ''
  const isWechatComplete = currentProfile.wechat.trim() !== ''
  
  const missingFields: string[] = []
  
  if (!isGenderComplete) missingFields.push('性别')
  if (!isSchoolComplete) missingFields.push('学校')
  if (!isWechatComplete) missingFields.push('微信号')
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    missingText: missingFields.join('、'),
  }
}

/**
 * 显示个人资料未完善的提示对话框
 * @param missingText 缺失字段文本，如 "性别、学校"
 * @param options 可选配置
 * @returns Promise<boolean> 用户是否选择去完善
 */
export async function showProfileIncompleteModal(
  missingText: string,
  options?: {
    title?: string
    content?: string
    confirmText?: string
    cancelText?: string
  }
): Promise<boolean> {
  const result = await wx.showModal({
    title: options?.title || '请先完善个人资料',
    content: options?.content || `请先在个人中心填写${missingText}信息，这些是进行室友匹配的必填项。`,
    confirmText: options?.confirmText || '去完善',
    cancelText: options?.cancelText || '稍后',
  })
  
  if (result.confirm) {
    wx.navigateTo({ url: '/pages/profile/profile' })
    return true
  }
  
  return false
}

/**
 * 显示个人资料未完善的Toast提示
 * @param missingText 缺失字段文本，如 "性别、学校"
 */
export function showProfileIncompleteToast(missingText: string): void {
  wx.showToast({
    title: `请先完善${missingText}信息`,
    icon: 'none',
    duration: 2500,
  })
}

/**
 * 检查并提示个人资料是否完整（使用对话框）
 * @returns Promise<boolean> 资料是否完整
 */
export async function checkAndPromptProfile(): Promise<boolean> {
  const validation = validateRequiredProfile()
  
  if (!validation.isValid) {
    await showProfileIncompleteModal(validation.missingText)
    return false
  }
  
  return true
}

/**
 * 检查并提示个人资料是否完整（使用Toast）
 * @returns boolean 资料是否完整
 */
export function checkAndToastProfile(): boolean {
  const validation = validateRequiredProfile()
  
  if (!validation.isValid) {
    showProfileIncompleteToast(validation.missingText)
    return false
  }
  
  return true
}

/**
 * 检查年龄是否符合要求（18周岁及以上）
 * @param age 年龄
 * @returns boolean 是否符合要求
 */
export function validateAge(age: string | number): boolean {
  const ageNum = typeof age === 'string' ? Number(age) : age
  return ageNum >= 18
}

/**
 * 显示年龄不符合要求的提示
 */
export function showAgeWarning(): void {
  wx.showToast({
    title: '平台仅限18周岁及以上用户使用',
    icon: 'none',
    duration: 2500,
  })
}
