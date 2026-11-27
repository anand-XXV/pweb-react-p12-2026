import type { Application } from '../types/application'

const fourteenDays = 14 * 24 * 60 * 60 * 1000

export function isGhostingRisk(application: Application, now = Date.now()): boolean {
  return (application.status === 'APPLIED' || application.status === 'SCREENING') &&
    now - Date.parse(application.lastUpdatedAt) > fourteenDays
}

export function calculateStatistics(applications: readonly Application[], now = Date.now()) {
  const total = applications.length
  const responded = applications.filter(({ status }) => ['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'].includes(status)).length
  const interviewed = applications.filter(({ status }) => status === 'INTERVIEW' || status === 'OFFER').length
  return {
    total,
    responded,
    interviewed,
    responseRate: total === 0 ? 0 : Math.round(responded / total * 100),
    interviewRate: total === 0 ? 0 : Math.round(interviewed / total * 100),
    ghosting: applications.filter((application) => isGhostingRisk(application, now)).length,
    offers: applications.filter(({ status }) => status === 'OFFER').length,
  }
}
