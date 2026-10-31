import { requireCoordinator, isSuperCoordinator } from '../../utils/auth-role'

export default defineEventHandler(async (event) => {
  const actor = await requireCoordinator(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { isSuperCoordinator: isSuperCoordinator(event, actor) }
})
