import type { Application, ApplicationStatus, WorkMode } from '../types/application'
import { calculateSkillMatch } from './jobUtils'

export interface TransitionDetails {
  cvVersion?: string
  appliedDate?: string
  interviewDateTime?: string
  salaryOffer?: number
  workMode?: WorkMode
}

export interface InterviewConflict {
  first: Application
  second: Application
  minutesApart: number
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
const CONFLICT_WINDOW_MINUTES = 60

const statusTransitions: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  WISHLIST: ['APPLIED'],
  APPLIED: ['SCREENING', 'GHOSTED', 'REJECTED'],
  SCREENING: ['INTERVIEW', 'GHOSTED', 'REJECTED'],
  INTERVIEW: ['OFFER', 'GHOSTED', 'REJECTED'],
  OFFER: [],
  REJECTED: [],
  GHOSTED: ['SCREENING'],
}

export function getAllowedTransitions(status: ApplicationStatus): ApplicationStatus[] {
  return [...statusTransitions[status]]
}

export function isValidTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return statusTransitions[from].includes(to)
}

export function isAtRiskOfGhosting(application: Application, now = Date.now()): boolean {
  if (application.status !== 'APPLIED' && application.status !== 'SCREENING') return false
  const updatedAt = Date.parse(application.lastUpdatedAt)
  return Number.isFinite(updatedAt) && now - updatedAt > FOURTEEN_DAYS_MS
}

export function getInterviewConflicts(
  applications: readonly Application[],
): InterviewConflict[] {
  const interviews = applications
    .map((application) => ({
      application,
      time: application.interviewDateTime ? Date.parse(application.interviewDateTime) : Number.NaN,
    }))
    .filter(
      (entry) => entry.application.status === 'INTERVIEW' && Number.isFinite(entry.time),
    )
    .sort((a, b) => a.time - b.time)

  const conflicts: InterviewConflict[] = []

  for (let index = 0; index < interviews.length; index += 1) {
    const first = interviews[index]
    if (!first) continue

    for (let nextIndex = index + 1; nextIndex < interviews.length; nextIndex += 1) {
      const second = interviews[nextIndex]
      if (!second) continue

      const minutesApart = Math.round((second.time - first.time) / 60_000)
      if (minutesApart < CONFLICT_WINDOW_MINUTES) {
        conflicts.push({
          first: first.application,
          second: second.application,
          minutesApart,
        })
      }
    }
  }

  return conflicts
}

export function getApplicationMatch(
  application: Application,
  skills: readonly string[],
): number {
  return calculateSkillMatch(skills, application.requiredSkills)
}

export function formatShortDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
}

export function formatShortDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function buildTransitionLogMessage(
  from: ApplicationStatus,
  to: ApplicationStatus,
  details: TransitionDetails,
): string {
  if (to === 'APPLIED' && details.cvVersion) {
    const dateSuffix = details.appliedDate ? ` · ${formatShortDate(details.appliedDate)}` : ''
    return `Lamaran dikirim (CV: ${details.cvVersion}${dateSuffix}).`
  }

  if (to === 'INTERVIEW' && details.interviewDateTime) {
    return `Pindah dari ${from} ke INTERVIEW (jadwal ${formatShortDateTime(details.interviewDateTime)}).`
  }

  if (to === 'OFFER' && typeof details.salaryOffer === 'number') {
    const modeLabel = details.workMode ? ` · ${details.workMode}` : ''
    return `Menerima OFFER (${formatRupiah(details.salaryOffer)}${modeLabel}).`
  }

  if (from === 'GHOSTED' && to === 'SCREENING') {
    return 'Bangkit dari GHOSTED kembali ke tahap SCREENING.'
  }

  return `Status berubah dari ${from} ke ${to}.`
}
