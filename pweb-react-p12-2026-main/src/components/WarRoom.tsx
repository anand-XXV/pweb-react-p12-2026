import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  Application,
  ApplicationStatus,
  WorkMode,
} from '../types/application'
import {
  formatRupiah,
  formatShortDate,
  formatShortDateTime,
  getAllowedTransitions,
  getApplicationMatch,
  getInterviewConflicts,
  isAtRiskOfGhosting,
  type TransitionDetails,
} from '../utils/applicationUtils'
import { getMatchTone, getMissingSkills } from '../utils/jobUtils'

const statuses: ApplicationStatus[] = [
  'WISHLIST',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'GHOSTED',
]

const stageSteps: { status: ApplicationStatus; label: string }[] = [
  { status: 'WISHLIST', label: '1. Wishlist' },
  { status: 'APPLIED', label: '2. Applied' },
  { status: 'SCREENING', label: '3. Screening' },
  { status: 'INTERVIEW', label: '4. Interview' },
  { status: 'OFFER', label: '5. Offer' },
]

type SortMode = 'newest' | 'interview' | 'offer'

interface WarRoomProps {
  applications: readonly Application[]
  skills: readonly string[]
  onSelect: (id: string) => void
  onCloseDetail: () => void
  selected: Application | undefined
  onTransition: (
    id: string,
    status: ApplicationStatus,
    details: TransitionDetails,
  ) => void
  onChecklistAdd: (id: string, text: string) => void
  onChecklistToggle: (id: string, itemId: string) => void
  onChecklistRemove: (id: string, itemId: string) => void
  onAddNote: (id: string, note: string) => void
  onSimulateGhosting: (id: string) => void
}

export function InterviewConflictBanner({
  applications,
}: {
  applications: readonly Application[]
}) {
  const conflicts = useMemo(
    () => getInterviewConflicts(applications),
    [applications],
  )

  if (conflicts.length === 0) return null

  return (
    <div className="conflict-banner" role="alert">
      <strong>Jadwal Interview Bentrok</strong>
      <span>
        {conflicts
          .map(
            ({ first, second }) =>
              `${first.company} (${formatShortDateTime(first.interviewDateTime ?? '')}) dan ${second.company} (${formatShortDateTime(second.interviewDateTime ?? '')})`,
          )
          .join(' · ')}{' '}
        berselisih kurang dari 60 menit.
      </span>
    </div>
  )
}

export function WarRoom(props: WarRoomProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL')
  const [riskOnly, setRiskOnly] = useState(false)
  const [sort, setSort] = useState<SortMode>('newest')

  const visibleApplications = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return props.applications
      .filter(
        (application) =>
          statusFilter === 'ALL' || application.status === statusFilter,
      )
      .filter((application) => !riskOnly || isAtRiskOfGhosting(application))
      .filter((application) => {
        if (!needle) return true
        const searchable = [
          application.company,
          application.role,
          application.cvVersion ?? '',
          ...application.requiredSkills,
        ]
          .join(' ')
          .toLocaleLowerCase()
        return searchable.includes(needle)
      })
      .sort((first, second) => {
        if (sort === 'interview') {
          return (
            dateValue(first.interviewDateTime) -
            dateValue(second.interviewDateTime)
          )
        }
        if (sort === 'offer') {
          return (second.salaryOffer ?? 0) - (first.salaryOffer ?? 0)
        }
        return Date.parse(second.lastUpdatedAt) - Date.parse(first.lastUpdatedAt)
      })
  }, [props.applications, query, riskOnly, sort, statusFilter])

  return (
    <section
      className="war-room"
      id="war-room"
      aria-labelledby="war-room-title"
    >
      <div className="war-room-heading">
        <div>
          <p className="eyebrow">TRACKING LAMARAN</p>
          <h2 id="war-room-title">War Room Pipeline</h2>
          <p className="heading-copy">
            Pantau progres, jadwal interview, deteksi ghosting, dan tindak
            lanjut semua lamaran.
          </p>
        </div>
        <span className="pipeline-total">
          {visibleApplications.length === props.applications.length
            ? `${props.applications.length} lamaran`
            : `${visibleApplications.length} dari ${props.applications.length} lamaran`}
        </span>
      </div>

      <div className="pipeline-toolbar">
        <label className="search-field">
          <span className="visually-hidden">Cari lamaran</span>
          <span aria-hidden="true" className="search-icon">
            ⌕
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Cari perusahaan, posisi, CV, atau skill..."
            type="search"
          />
        </label>
        <label className="select-field">
          <span className="visually-hidden">Filter status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.currentTarget.value as 'ALL' | ApplicationStatus,
              )
            }
          >
            <option value="ALL">Semua Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="select-field">
          <span className="visually-hidden">Urutkan lamaran</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.currentTarget.value as SortMode)}
          >
            <option value="newest">Terbaru</option>
            <option value="interview">Jadwal Interview Terdekat</option>
            <option value="offer">Offer Tertinggi</option>
          </select>
        </label>
        <label className="risk-toggle">
          <input
            type="checkbox"
            checked={riskOnly}
            onChange={(event) => setRiskOnly(event.currentTarget.checked)}
          />
          Hanya Rawan Ghosting
        </label>
      </div>

      <div
        className={`pipeline-layout ${props.selected ? '' : 'pipeline-layout-single'}`}
      >
        <div className="application-list">
          {visibleApplications.length === 0 ? (
            <div className="state-card pipeline-empty">
              <h3>
                {props.applications.length
                  ? 'Tidak ada lamaran yang cocok'
                  : 'Pipeline masih kosong'}
              </h3>
              <p>
                {props.applications.length
                  ? 'Coba ubah kata pencarian, filter status, atau matikan filter Rawan Ghosting.'
                  : 'Tambahkan lamaran dari daftar lowongan atau tombol + Catat Lamaran.'}
              </p>
            </div>
          ) : (
            visibleApplications.map((application) => {
              const risk = isAtRiskOfGhosting(application)
              const completed = application.checklist.filter(
                (item) => item.done,
              ).length
              const match = getApplicationMatch(application, props.skills)
              const tone = getMatchTone(match)
              return (
                <article
                  className={`application-card ${props.selected?.id === application.id ? 'application-card-active' : ''}`}
                  key={application.id}
                >
                  <div className="application-card-top">
                    <div className="pill-group">
                      <span
                        className={`status-pill status-${application.status.toLowerCase()}`}
                      >
                        {application.status}
                      </span>
                      {risk && (
                        <span className="risk-pill">Rawan Ghosting</span>
                      )}
                    </div>
                    <span className={`match-badge match-${tone}`}>
                      {match}% Match
                    </span>
                  </div>
                  <h3>{application.role}</h3>
                  <p className="application-company">
                    {application.company} · {application.workMode}
                  </p>
                  <div className="application-meta">
                    <span>CV: {application.cvVersion || 'Belum dicatat'}</span>
                    <span>
                      Checklist {completed}/{application.checklist.length}
                    </span>
                  </div>
                  <div
                    className="progress-track"
                    aria-label={`Checklist ${completed} dari ${application.checklist.length} selesai`}
                  >
                    <span
                      style={{
                        width: `${application.checklist.length ? (completed / application.checklist.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {application.interviewDateTime && (
                    <p className="application-interview">
                      Interview ·{' '}
                      {formatShortDateTime(application.interviewDateTime)}
                    </p>
                  )}
                  {typeof application.salaryOffer === 'number' &&
                    application.salaryOffer > 0 && (
                      <p className="application-offer">
                        Offer · {formatRupiah(application.salaryOffer)}
                      </p>
                    )}
                  <div className="application-card-actions">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => props.onSelect(application.id)}
                    >
                      {props.selected?.id === application.id
                        ? 'Tutup Detail'
                        : 'Detail Lamaran'}
                    </button>
                    {(application.status === 'APPLIED' ||
                      application.status === 'SCREENING') && (
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => props.onSimulateGhosting(application.id)}
                      >
                        Simulasi +15 Hari
                      </button>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>

        {props.selected && (
          <ApplicationDetail
            key={props.selected.id}
            application={props.selected}
            skills={props.skills}
            onClose={props.onCloseDetail}
            onTransition={props.onTransition}
            onChecklistAdd={props.onChecklistAdd}
            onChecklistToggle={props.onChecklistToggle}
            onChecklistRemove={props.onChecklistRemove}
            onAddNote={props.onAddNote}
            onSimulateGhosting={props.onSimulateGhosting}
          />
        )}
      </div>
    </section>
  )
}

interface DetailProps {
  application: Application
  skills: readonly string[]
  onClose: () => void
  onTransition: WarRoomProps['onTransition']
  onChecklistAdd: WarRoomProps['onChecklistAdd']
  onChecklistToggle: WarRoomProps['onChecklistToggle']
  onChecklistRemove: WarRoomProps['onChecklistRemove']
  onAddNote: WarRoomProps['onAddNote']
  onSimulateGhosting: WarRoomProps['onSimulateGhosting']
}

function ApplicationDetail({
  application,
  skills,
  onClose,
  onTransition,
  onChecklistAdd,
  onChecklistToggle,
  onChecklistRemove,
  onAddNote,
  onSimulateGhosting,
}: DetailProps) {
  const allowed = getAllowedTransitions(application.status)
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus | ''>('')
  const [cvVersion, setCvVersion] = useState(application.cvVersion ?? '')
  const [appliedDate, setAppliedDate] = useState(application.appliedDate ?? '')
  const [interviewDateTime, setInterviewDateTime] = useState(
    application.interviewDateTime ?? '',
  )
  const [salaryOffer, setSalaryOffer] = useState(
    application.salaryOffer ? String(application.salaryOffer) : '',
  )
  const [workMode, setWorkMode] = useState<WorkMode>(application.workMode)
  const [transitionError, setTransitionError] = useState('')
  const [checklistText, setChecklistText] = useState('')
  const [checklistError, setChecklistError] = useState('')
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')

  const done = application.checklist.filter((item) => item.done).length
  const score = getApplicationMatch(application, skills)
  const tone = getMatchTone(score)
  const risk = isAtRiskOfGhosting(application)
  const missingSkills = new Set(
    getMissingSkills(skills, application.requiredSkills).map((skill) =>
      skill.toLocaleLowerCase(),
    ),
  )
  const currentStageIndex = stageSteps.findIndex(
    (step) => step.status === application.status,
  )

  function handleTargetStatusChange(nextStatus: ApplicationStatus | '') {
    setTargetStatus(nextStatus)
    setTransitionError('')
    if (nextStatus === 'APPLIED' && !appliedDate) {
      setAppliedDate(new Date().toISOString().slice(0, 10))
    }
  }

  function submitTransition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!targetStatus || !allowed.includes(targetStatus)) return

    if (targetStatus === 'APPLIED' && (!cvVersion.trim() || !appliedDate)) {
      setTransitionError('Versi CV dan tanggal melamar wajib diisi.')
      return
    }
    if (targetStatus === 'INTERVIEW' && !interviewDateTime) {
      setTransitionError('Tanggal dan waktu interview wajib diisi.')
      return
    }
    if (
      targetStatus === 'OFFER' &&
      (!Number.isFinite(Number(salaryOffer)) ||
        Number(salaryOffer) <= 0 ||
        !workMode)
    ) {
      setTransitionError(
        'Masukkan nominal offer lebih dari 0 dan pilih mode kerja.',
      )
      return
    }

    setTransitionError('')
    onTransition(application.id, targetStatus, {
      ...(targetStatus === 'APPLIED'
        ? { cvVersion: cvVersion.trim(), appliedDate }
        : {}),
      ...(targetStatus === 'INTERVIEW' ? { interviewDateTime } : {}),
      ...(targetStatus === 'OFFER'
        ? { salaryOffer: Number(salaryOffer), workMode }
        : {}),
    })
    setTargetStatus('')
  }

  function submitChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = checklistText.trim()
    if (!trimmed) {
      setChecklistError('Tulis nama tugas persiapan terlebih dahulu.')
      return
    }
    setChecklistError('')
    onChecklistAdd(application.id, trimmed)
    setChecklistText('')
  }

  function submitActivityNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = note.trim()
    if (!trimmed) {
      setNoteError('Catatan aktivitas tidak boleh kosong.')
      return
    }
    setNoteError('')
    onAddNote(application.id, trimmed)
    setNote('')
  }

  return (
    <aside className="application-detail" aria-labelledby="detail-title">
      <div className="detail-heading">
        <div>
          <p className="eyebrow">DETAIL LAMARAN</p>
          <h3 id="detail-title">{application.role}</h3>
          <p>
            {application.company} · {application.workMode}
            {application.cvVersion ? ` · CV: ${application.cvVersion}` : ''}
          </p>
        </div>
        <div className="detail-header-actions">
          <span className={`match-badge match-${tone}`}>{score}% Match</span>
          <button
            aria-label="Tutup detail lamaran"
            className="close-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
      </div>

      <div className="detail-status-row">
        <div className="pill-group">
          <span
            className={`status-pill status-${application.status.toLowerCase()}`}
          >
            {application.status}
          </span>
          {risk && <span className="risk-pill">Rawan Ghosting</span>}
        </div>
        <span>Terakhir diperbarui {formatShortDate(application.lastUpdatedAt)}</span>
      </div>

      {(application.status === 'APPLIED' ||
        application.status === 'SCREENING') && (
        <div className="detail-quick-actions">
          <button
            className="button button-secondary"
            onClick={() => onSimulateGhosting(application.id)}
            type="button"
          >
            Simulasi +15 Hari
          </button>
        </div>
      )}

      {(application.appliedDate ||
        application.interviewDateTime ||
        typeof application.salaryOffer === 'number') && (
        <div className="detail-facts">
          {application.appliedDate && (
            <span>Melamar: {formatShortDate(application.appliedDate)}</span>
          )}
          {application.interviewDateTime && (
            <span>
              Jadwal Interview:{' '}
              {formatShortDateTime(application.interviewDateTime)}
            </span>
          )}
          {typeof application.salaryOffer === 'number' &&
            application.salaryOffer > 0 && (
              <span>Offer: {formatRupiah(application.salaryOffer)}</span>
            )}
        </div>
      )}

      {application.requiredSkills.length > 0 && (
        <div className="detail-skills" aria-label="Skill yang dibutuhkan">
          {application.requiredSkills.map((skill) => {
            const isMissing = missingSkills.has(skill.toLocaleLowerCase())
            return (
              <span
                className={`job-tag ${isMissing ? 'job-tag-missing' : 'job-tag-matched'}`}
                key={skill}
              >
                {skill}
              </span>
            )
          })}
        </div>
      )}

      <section className="detail-section">
        <h4>Tahap Seleksi</h4>
        <ol className="stage-stepper" aria-label="Progres tahap seleksi">
          {stageSteps.map((step, index) => {
            const isActive = step.status === application.status
            const isDone =
              currentStageIndex >= 0 && index < currentStageIndex
            return (
              <li
                key={step.status}
                className={`stage-step ${isActive ? 'stage-step-active' : ''} ${isDone ? 'stage-step-done' : ''}`}
              >
                <span className="stage-bar" aria-hidden="true" />
                <span className="stage-label">{step.label}</span>
              </li>
            )
          })}
        </ol>
        {(application.status === 'GHOSTED' ||
          application.status === 'REJECTED') && (
          <p className="detail-muted stage-note">
            Status saat ini: <strong>{application.status}</strong>
            {application.status === 'GHOSTED'
              ? ' — masih dapat kembali ke SCREENING jika HRD membalas.'
              : ' — proses seleksi pada lamaran ini telah selesai.'}
          </p>
        )}
      </section>

      <section className="detail-section">
        <h4>Perbarui Status</h4>
        {allowed.length === 0 ? (
          <p className="detail-muted">
            Status {application.status} bersifat final dan tidak dapat
            dipindahkan lagi.
          </p>
        ) : (
          <form className="detail-form" noValidate onSubmit={submitTransition}>
            <label className="form-field">
              <span>Status tujuan yang diizinkan</span>
              <select
                value={targetStatus}
                onChange={(event) =>
                  handleTargetStatusChange(
                    event.currentTarget.value as ApplicationStatus | '',
                  )
                }
              >
                <option value="">Pilih status berikutnya</option>
                {allowed.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            {targetStatus === 'APPLIED' && (
              <div className="detail-input-grid">
                <label className="form-field">
                  <span>Versi CV</span>
                  <input
                    value={cvVersion}
                    onChange={(event) =>
                      setCvVersion(event.currentTarget.value)
                    }
                    placeholder="Contoh: Kapten-CV-v2.pdf"
                  />
                </label>
                <label className="form-field">
                  <span>Tanggal melamar</span>
                  <input
                    type="date"
                    value={appliedDate}
                    onChange={(event) =>
                      setAppliedDate(event.currentTarget.value)
                    }
                  />
                </label>
              </div>
            )}

            {targetStatus === 'INTERVIEW' && (
              <label className="form-field">
                <span>Tanggal dan waktu interview</span>
                <input
                  type="datetime-local"
                  value={interviewDateTime}
                  onChange={(event) =>
                    setInterviewDateTime(event.currentTarget.value)
                  }
                />
              </label>
            )}

            {targetStatus === 'OFFER' && (
              <div className="detail-input-grid">
                <label className="form-field">
                  <span>Gaji / uang saku (Rp)</span>
                  <input
                    min="1"
                    type="number"
                    value={salaryOffer}
                    onChange={(event) =>
                      setSalaryOffer(event.currentTarget.value)
                    }
                    placeholder="4500000"
                  />
                </label>
                <label className="form-field">
                  <span>Mode kerja</span>
                  <select
                    value={workMode}
                    onChange={(event) =>
                      setWorkMode(event.currentTarget.value as WorkMode)
                    }
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </label>
              </div>
            )}

            {transitionError && (
              <p className="field-error" role="alert">
                {transitionError}
              </p>
            )}

            <button
              className="button button-primary"
              type="submit"
              disabled={!targetStatus}
            >
              Konfirmasi Perubahan Status
            </button>
          </form>
        )}
      </section>

      <section className="detail-section">
        <div className="section-title-row">
          <h4>Daftar Persiapan</h4>
          <span className="detail-muted">
            {done}/{application.checklist.length} selesai
          </span>
        </div>
        <div
          className="progress-track detail-progress"
          aria-label={`${done} dari ${application.checklist.length} checklist selesai`}
        >
          <span
            style={{
              width: `${application.checklist.length ? (done / application.checklist.length) * 100 : 0}%`,
            }}
          />
        </div>
        {application.checklist.length ? (
          <ul className="checklist-list">
            {application.checklist.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => onChecklistToggle(application.id, item.id)}
                  />
                  <span className={item.done ? 'checklist-done' : ''}>
                    {item.text}
                  </span>
                </label>
                <button
                  aria-label={`Hapus checklist ${item.text}`}
                  className="text-button danger-text"
                  type="button"
                  onClick={() => onChecklistRemove(application.id, item.id)}
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-muted">Belum ada tugas persiapan.</p>
        )}
        <form className="inline-add-form" onSubmit={submitChecklistItem}>
          <input
            aria-label="Tugas persiapan baru"
            value={checklistText}
            onChange={(event) => {
              setChecklistText(event.currentTarget.value)
              setChecklistError('')
            }}
            placeholder="Tambah tugas persiapan baru..."
          />
          <button className="button button-secondary" type="submit">
            Tambah
          </button>
        </form>
        {checklistError && (
          <p className="field-error" role="alert">
            {checklistError}
          </p>
        )}
      </section>

      <section className="detail-section">
        <h4>Riwayat Aktivitas</h4>
        <form className="inline-add-form" onSubmit={submitActivityNote}>
          <input
            aria-label="Catatan aktivitas"
            value={note}
            onChange={(event) => {
              setNote(event.currentTarget.value)
              setNoteError('')
            }}
            placeholder="Tulis catatan Kapten..."
          />
          <button className="button button-secondary" type="submit">
            Catat
          </button>
        </form>
        {noteError && (
          <p className="field-error" role="alert">
            {noteError}
          </p>
        )}
        <ol className="activity-list">
          {[...application.activityLogs].reverse().map((entry) => (
            <li key={entry.id}>
              <span className="activity-dot" aria-hidden="true" />
              <div>
                <p>{entry.message}</p>
                <time dateTime={entry.timestamp}>
                  {formatShortDateTime(entry.timestamp)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  )
}

function dateValue(value?: string): number {
  const time = value ? Date.parse(value) : Number.POSITIVE_INFINITY
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY
}
