export type EnvConfig = {
  baseUrl: string
}

export const envConfig: EnvConfig = {
  baseUrl: 'https://www.roomiematch.site',
}

export function isFullUrl(url: string): boolean {
  return /^https?:\/\//.test(url)
}
