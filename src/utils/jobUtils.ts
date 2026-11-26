import type { Application } from '../types/application'
import type { JobListing } from '../types/job'

export function calculateSkillMatch(
  candidateSkills: readonly string[],
  requiredSkills: readonly string[],
): number {
  if (requiredSkills.length === 0) return 0

  const normalizedCandidateSkills = new Set(
    candidateSkills.map((skill) => skill.trim().toLocaleLowerCase()),
  )
  const matchedCount = requiredSkills.filter((skill) =>
    normalizedCandidateSkills.has(skill.trim().toLocaleLowerCase()),
  ).length

  return Math.round((matchedCount / requiredSkills.length) * 100)
}

export function getMatchTone(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export function getMissingSkills(
  candidateSkills: readonly string[],
  requiredSkills: readonly string[],
): string[] {
  const normalizedCandidateSkills = new Set(
    candidateSkills.map((skill) => skill.trim().toLocaleLowerCase()),
  )

  return requiredSkills.filter(
    (skill) => !normalizedCandidateSkills.has(skill.trim().toLocaleLowerCase()),
  )
}

export function getCategories(jobs: readonly JobListing[]): string[] {
  return [...new Set(jobs.map((job) => job.category).filter(Boolean))].sort(
    (first, second) => first.localeCompare(second),
  )
}

export function isDuplicateApplication(
  applications: readonly Application[],
  company: string,
  role: string,
): boolean {
  const normalizedCompany = company.trim().toLocaleLowerCase()
  const normalizedRole = role.trim().toLocaleLowerCase()

  return applications.some(
    (application) =>
      application.company.trim().toLocaleLowerCase() === normalizedCompany &&
      application.role.trim().toLocaleLowerCase() === normalizedRole,
  )
}
