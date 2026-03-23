export const PROFILE_STORAGE_KEY = 'roomiematch-profile'
export const FORM_STORAGE_KEY = 'roomiematch-form'
export const AUTH_STORAGE_KEY = 'roomiematch-auth'

export type SchoolOption = {
  value: string
  label: string
}

export const schoolOptions: readonly SchoolOption[] = [
  { value: 'Kaplan', label: 'Kaplan 新加坡楷博高等教育学院' },
  { value: 'JCU', label: 'JCU 詹姆斯库克大学新加坡校区' },
  { value: 'Curtin', label: 'Curtin 科廷大学新加坡校区' },
  { value: 'SIM', label: 'SIM 新加坡管理学院' },
  { value: 'MDIS', label: 'MDIS 新加坡管理发展学院' },
  { value: 'PSB/NAFA', label: 'PSB / NAFA 新加坡PSB学院 / 南洋艺术学院' },
  { value: 'NTU', label: 'NTU 南洋理工大学' },
  { value: 'NUS', label: 'NUS 新加坡国立大学' },
  { value: 'Amity', label: 'Amity 新加坡阿米提全球学院' },
  { value: 'EAIM', label: 'EAIM 新加坡东亚管理学院' },
  { value: 'LSBF', label: 'LSBF 伦敦商学院新加坡校区' },
  { value: 'SMU', label: 'SMU 新加坡管理大学' },
  { value: 'SRMC', label: 'SRMC 新加坡莱佛士音乐学院' },
  { value: 'LCA', label: 'LCA 新加坡拉萨尔艺术学院' },
]

export type ProfileGender = 'male' | 'female' | ''
export type PreferredRoommateGender = 'male' | 'female' | 'any' | ''
export type OccupantCount = '1' | '2' | ''
export type CleanLevel = '1' | '2' | '3' | '4' | '5' | ''
export type HouseType = 'studio' | '1b1b' | '2b1b' | '3b2b' | ''
export type RoomType = 'master' | 'common' | 'other' | ''

export interface ProfileData {
  nickName: string
  avatarUrl: string
  gender: ProfileGender
  age: string
  school: string
  wechat: string
}

export interface AuthSession {
  token: string
  openId: string
  userId: string
  nickName: string
  avatarUrl: string
  expiresAt: number | null
}

export interface RoomieFormData {
  preferredRoommateGender: PreferredRoommateGender
  occupantCount: OccupantCount
  cleanLevel: CleanLevel
  smoke: boolean | null
  drink: boolean | null
  hasGuest: boolean | null
  guestOvernight: boolean | null
  houseType: HouseType
  roomType: RoomType
  agencyFee: boolean | null
  budgetMin: string
  district: string
  budgetMax: string
  moveInYear: string
  moveInMonth: string
  intro: string
}

export function createDefaultProfile(): ProfileData {
  return {
    nickName: '',
    avatarUrl: '',
    gender: '',
    age: '',
    school: '',
    wechat: '',
  }
}

export function createDefaultAuthSession(): AuthSession {
  return {
    token: '',
    openId: '',
    userId: '',
    nickName: '',
    avatarUrl: '',
    expiresAt: null,
  }
}

export function createDefaultForm(): RoomieFormData {
  return {
    preferredRoommateGender: '',
    occupantCount: '',
    cleanLevel: '',
    smoke: null,
    drink: null,
    hasGuest: null,
    guestOvernight: null,
    houseType: '',
    roomType: '',
    agencyFee: null,
    budgetMin: '',
    district: '',
    budgetMax: '',
    moveInYear: '',
    moveInMonth: '',
    intro: '',
  }
}

export function getCurrentMoveInYears(): string[] {
  const year = new Date().getFullYear()
  return [String(year), String(year + 1)]
}

export function getMoveInMonths(): string[] {
  return Array.from({ length: 12 }, (_, index) => String(index + 1))
}

export function getProfileGenderText(gender: ProfileGender): string {
  if (gender === 'male') return '男生'
  if (gender === 'female') return '女生'
  return '未设置'
}

export function normalizeSchoolValue(value: string): string {
  const normalized = value.trim()
  const matched = schoolOptions.find((option) => option.value === normalized || option.label === normalized)
  return matched ? matched.value : normalized
}

export function getSchoolDisplayName(value: string): string {
  const normalized = normalizeSchoolValue(value)
  const matched = schoolOptions.find((option) => option.value === normalized)
  return matched ? matched.label : value
}
