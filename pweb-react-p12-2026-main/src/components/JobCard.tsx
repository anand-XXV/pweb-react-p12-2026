import type { JobListing } from '../types/job'
import { getMatchTone, getMissingSkills } from '../utils/jobUtils'

interface JobCardProps {
  job: JobListing
  candidateSkills: readonly string[]
  matchScore: number
  alreadyApplied: boolean
  onSave: () => void
}

export function JobCard({
  job,
  candidateSkills,
  matchScore,
  alreadyApplied,
  onSave,
}: JobCardProps) {
  const matchedSkillCount =
    job.tags.length - getMissingSkills(candidateSkills, job.tags).length
  const missingSkills = getMissingSkills(candidateSkills, job.tags)
  const matchTone = getMatchTone(matchScore)

  return (
    <article className="job-card">
      <div className="job-card-header">
        <div className="company-avatar" aria-hidden="true">
          {job.company_name.slice(0, 1).toLocaleUpperCase()}
        </div>
        <div className="company-details">
          <h2>{job.company_name}</h2>
          <p>{job.candidate_required_location}</p>
        </div>
        <span className={`match-badge match-${matchTone}`}>{matchScore}% Match</span>
      </div>

      <div className="job-title-wrap">
        <p className="job-category">{job.category}</p>
        <h3>{job.title}</h3>
      </div>

      <div className="job-tags" aria-label="Skill yang dibutuhkan">
        {job.tags.map((tag) => (
          <span className="job-tag" key={`${job.id}-${tag}`}>
            {tag}
          </span>
        ))}
      </div>

      <div className="match-details">
        <p>
          <strong>{matchedSkillCount}</strong> dari {job.tags.length} skill cocok
        </p>
        {missingSkills.length > 0 && (
          <p className="missing-skills">
            Belum dikuasai: {missingSkills.join(', ')}
          </p>
        )}
      </div>

      <div className="job-card-footer">
        <p className="salary">{job.salary || 'Gaji tidak dicantumkan'}</p>
        {job.url && (
          <a
            className="job-link"
            href={job.url}
            rel="noreferrer"
            target="_blank"
          >
            Detail
          </a>
        )}
        <button
          className={`button ${alreadyApplied ? 'button-disabled' : 'button-primary'}`}
          disabled={alreadyApplied}
          onClick={onSave}
          type="button"
        >
          {alreadyApplied ? 'Sudah Dilamar' : 'Simpan ke Wishlist'}
        </button>
      </div>
    </article>
  )
}
