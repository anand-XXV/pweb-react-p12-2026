import type { Application, WorkMode } from '../types/application'
import { calculateSkillMatch } from './jobUtils'

const modeScores: Record<WorkMode, number> = { Remote: 100, Hybrid: 75, Onsite: 50 }

export function calculateOfferScore(offer: Application, skills: readonly string[], maxSalary: number) {
  const salary = offer.salaryOffer ?? 0
  const salaryPoints = maxSalary > 0 ? salary / maxSalary * 50 : 0
  const modeScore = modeScores[offer.workMode]
  const modePoints = modeScore * 0.25
  const match = calculateSkillMatch(skills, offer.requiredSkills)
  const skillPoints = match * 0.25
  return { salary, salaryPoints, modeScore, modePoints, match, skillPoints, total: salaryPoints + modePoints + skillPoints }
}
