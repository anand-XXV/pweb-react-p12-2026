export type ApplicationStatus =
  | 'WISHLIST'
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'GHOSTED'

export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface ActivityLog {
  id: string
  timestamp: string
  message: string
}

export interface Application {
  id: string
  jobId?: number | string
  company: string
  role: string
  workMode: WorkMode
  status: ApplicationStatus
  requiredSkills: string[]
  cvVersion?: string
  appliedDate?: string
  interviewDateTime?: string
  salaryOffer?: number
  lastUpdatedAt: string
  checklist: ChecklistItem[]
  activityLogs: ActivityLog[]
}

export type ApplicationDraft = Pick<
  Application,
  'company' | 'role' | 'workMode' | 'status' | 'requiredSkills'
> &
  Partial<Pick<Application, 'cvVersion' | 'appliedDate'>>
