export const getUserId = (user: any): string => {
  return user?.id || user?.sub || ''
}
