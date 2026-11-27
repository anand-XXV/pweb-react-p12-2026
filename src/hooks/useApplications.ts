import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type {
  ActivityLog,
  Application,
  ApplicationStatus,
  ChecklistItem,
  WorkMode,
} from '../types/application'

const applicationStatuses: ApplicationStatus[] = [
  'WISHLIST',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'GHOSTED',
]
const workModes: WorkMode[] = ['Remote', 'Hybrid', 'Onsite']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isChecklistItem(value: unknown): value is ChecklistItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.done === 'boolean'
  )
}

function isActivityLog(value: unknown): value is ActivityLog {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.message === 'string'
  )
}

function isApplication(value: unknown): value is Application {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.jobId === undefined ||
      typeof value.jobId === 'string' ||
      typeof value.jobId === 'number') &&
    typeof value.company === 'string' &&
    typeof value.role === 'string' &&
    workModes.includes(value.workMode as WorkMode) &&
    applicationStatuses.includes(value.status as ApplicationStatus) &&
    Array.isArray(value.requiredSkills) &&
    value.requiredSkills.every((skill) => typeof skill === 'string') &&
    (value.cvVersion === undefined || typeof value.cvVersion === 'string') &&
    (value.appliedDate === undefined || typeof value.appliedDate === 'string') &&
    (value.interviewDateTime === undefined ||
      typeof value.interviewDateTime === 'string') &&
    (value.salaryOffer === undefined || typeof value.salaryOffer === 'number') &&
    typeof value.lastUpdatedAt === 'string' &&
    Array.isArray(value.checklist) &&
    value.checklist.every(isChecklistItem) &&
    Array.isArray(value.activityLogs) &&
    value.activityLogs.every(isActivityLog)
  )
}

function isApplicationArray(value: unknown): value is Application[] {
  return Array.isArray(value) && value.every(isApplication)
}

export function useApplications() {
  const {
    value: applications,
    setValue: setApplications,
    error: storageError,
  } = useLocalStorage<Application[]>(
    'aku-mw-magang-applications',
    [],
    isApplicationArray,
  )

  const addApplication = useCallback(
    (application: Application) => {
      setApplications((currentApplications) => [
        application,
        ...currentApplications,
      ])
    },
    [setApplications],
  )

  return { applications, setApplications, addApplication, storageError }
}
