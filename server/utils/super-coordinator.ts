export const parseSuperCoordinatorEmails = (value: string | undefined) => {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
}
