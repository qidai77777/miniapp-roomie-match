import {
  createDefaultForm,
  createDefaultProfile,
  FORM_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  type ProfileData,
  type RoomieFormData,
} from './roomie'

function safeRead<T>(key: string, fallback: T): T {
  try {
    const value = wx.getStorageSync(key) as T | '' | undefined
    if (!value) return fallback
    return value
  } catch {
    return fallback
  }
}

export function loadProfile(): ProfileData {
  const fallback = createDefaultProfile()
  const raw = safeRead<Partial<ProfileData>>(PROFILE_STORAGE_KEY, fallback)

  return {
    gender: raw.gender === 'male' || raw.gender === 'female' ? raw.gender : '',
    age: typeof raw.age === 'string' ? raw.age : '',
    school: typeof raw.school === 'string' ? raw.school : '',
    wechat: typeof raw.wechat === 'string' ? raw.wechat : '',
  }
}

export function saveProfile(profile: ProfileData) {
  wx.setStorageSync(PROFILE_STORAGE_KEY, profile)
}

export function loadForm(): RoomieFormData {
  const fallback = createDefaultForm()
  const raw = safeRead<Partial<RoomieFormData>>(FORM_STORAGE_KEY, fallback)

  return {
    preferredRoommateGender:
      raw.preferredRoommateGender === 'male' ||
      raw.preferredRoommateGender === 'female' ||
      raw.preferredRoommateGender === 'any'
        ? raw.preferredRoommateGender
        : '',
    occupantCount: raw.occupantCount === '1' || raw.occupantCount === '2' ? raw.occupantCount : '',
    cleanLevel:
      raw.cleanLevel === '1' ||
      raw.cleanLevel === '2' ||
      raw.cleanLevel === '3' ||
      raw.cleanLevel === '4' ||
      raw.cleanLevel === '5'
        ? raw.cleanLevel
        : '',
    smoke: typeof raw.smoke === 'boolean' ? raw.smoke : null,
    drink: typeof raw.drink === 'boolean' ? raw.drink : null,
    hasGuest: typeof raw.hasGuest === 'boolean' ? raw.hasGuest : null,
    guestOvernight: typeof raw.guestOvernight === 'boolean' ? raw.guestOvernight : null,
    houseType:
      raw.houseType === 'studio' ||
      raw.houseType === '1b1b' ||
      raw.houseType === '2b1b' ||
      raw.houseType === '3b2b'
        ? raw.houseType
        : '',
    roomType:
      raw.roomType === 'master' || raw.roomType === 'common' || raw.roomType === 'other'
        ? raw.roomType
        : '',
    agencyFee: typeof raw.agencyFee === 'boolean' ? raw.agencyFee : null,
    budgetMin: typeof raw.budgetMin === 'string' ? raw.budgetMin : '',
    district: typeof raw.district === 'string' ? raw.district : '',
    budgetMax: typeof raw.budgetMax === 'string' ? raw.budgetMax : '',
    moveInYear: typeof raw.moveInYear === 'string' ? raw.moveInYear : '',
    moveInMonth: typeof raw.moveInMonth === 'string' ? raw.moveInMonth : '',
    intro: typeof raw.intro === 'string' ? raw.intro : '',
  }
}

export function saveForm(form: RoomieFormData) {
  wx.setStorageSync(FORM_STORAGE_KEY, form)
}

export function clearForm() {
  wx.removeStorageSync(FORM_STORAGE_KEY)
}
