import { useEffect, useMemo, useState } from 'react'
import { DashboardStats } from './components/DashboardStats'
import { FeatureDemoPipeline } from './components/FeatureDemoPipeline'
import { OfferComparator } from './components/OfferComparator'
import { UndoToast } from './components/UndoToast'
import { useUndoDelete } from './hooks/useUndoDelete'
import { JobCard } from './components/JobCard'
import { ManualApplicationForm } from './components/ManualApplicationForm'
import { SkillProfile } from './components/SkillProfile'
import { useApplications } from './hooks/useApplications'
import { useDebounce } from './hooks/useDebounce'
import { useLocalStorage } from './hooks/useLocalStorage'
import { fetchFallbackJobs, fetchRemoteJobs } from './services/jobService'
import type { Application, ApplicationDraft } from './types/application'
import type { JobListing } from './types/job'
import {
  calculateSkillMatch,
  getCategories,
  isDuplicateApplication,
} from './utils/jobUtils'
import './App.css'

type DataSource = 'remote' | 'local'
type LoadState = 'loading' | 'ready' | 'error'

const initialSkills = ['React', 'TypeScript', 'CSS']

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((skill) => typeof skill === 'string')
}

function App() {
  const {
    value: skills,
    setValue: setSkills,
    error: skillsStorageError,
  } = useLocalStorage<string[]>('aku-mw-magang-skills', initialSkills, isStringArray)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [source, setSource] = useState<DataSource>('remote')
  const [effectiveSource, setEffectiveSource] = useState<DataSource>('remote')
  const [retryCount, setRetryCount] = useState(0)
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [loadMessage, setLoadMessage] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [activePage, setActivePage] = useState<'explore' | 'pipeline' | 'offers'>('explore')
  const debouncedSearch = useDebounce(search, 400)
  const {
    applications,
    addApplication,
    setApplications,
    storageError: applicationsStorageError,
  } = useApplications()
  const { pending, deleteApplication, undoDelete } = useUndoDelete(applications, setApplications)
  // Reservasi pasangan company + role selama Undo tersedia, agar tidak muncul duplikat saat dipulihkan.
  const duplicateCheckApplications = pending ? [...applications, pending.application] : applications

  function updateApplication(id: string, updater: (application: Application) => Application) {
    setApplications((current) => current.map((application) => application.id === id ? updater(application) : application))
  }

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function loadSelectedSource() {
      setLoadState('loading')
      setLoadMessage(null)

      try {
        const remoteJobs =
          source === 'remote'
            ? await fetchRemoteJobs(controller.signal)
            : await fetchFallbackJobs(controller.signal)
        if (!active) return

        setJobs(remoteJobs)
        setEffectiveSource(source)
        setLoadState('ready')
      } catch (error) {
        if (!active || controller.signal.aborted) return

        if (source === 'remote') {
          try {
            const fallbackJobs = await fetchFallbackJobs(controller.signal)
            if (!active) return

            setJobs(fallbackJobs)
            setEffectiveSource('local')
            setLoadState('ready')
            setLoadMessage(
              `API Remotive tidak dapat dimuat (${getErrorMessage(error)}). Dataset lokal ditampilkan.`,
            )
          } catch (fallbackError) {
            if (!active || controller.signal.aborted) return

            setJobs([])
            setLoadState('error')
            setLoadMessage(
              `API Remotive gagal: ${getErrorMessage(error)}. Dataset lokal juga gagal: ${getErrorMessage(fallbackError)}.`,
            )
          }
          return
        }

        setJobs([])
        setLoadState('error')
        setLoadMessage(`Dataset lokal gagal dimuat: ${getErrorMessage(error)}.`)
      }
    }

    void loadSelectedSource()

    return () => {
      active = false
      controller.abort()
    }
  }, [retryCount, source])

  const categories = useMemo(() => getCategories(jobs), [jobs])
  const filteredJobs = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLocaleLowerCase()

    return jobs
      .filter((job) => category === 'All categories' || job.category === category)
      .filter((job) => {
        if (!normalizedSearch) return true

        const searchableText = [
          job.title,
          job.company_name,
          job.category,
          ...job.tags,
        ]
          .join(' ')
          .toLocaleLowerCase()

        return searchableText.includes(normalizedSearch)
      })
      .sort((first, second) => {
        const firstMatch = calculateSkillMatch(skills, first.tags)
        const secondMatch = calculateSkillMatch(skills, second.tags)
        return secondMatch - firstMatch || first.title.localeCompare(second.title)
      })
  }, [category, debouncedSearch, jobs, skills])

  function createApplication(draft: ApplicationDraft) {
    const now = new Date().toISOString()
    const application: Application = {
      ...draft,
      id: crypto.randomUUID(),
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message:
            draft.status === 'WISHLIST'
              ? 'Lamaran disimpan ke Wishlist.'
              : 'Lamaran dibuat secara manual.',
        },
      ],
    }

    addApplication(application)
    setShowManualForm(false)
  }

  function saveToWishlist(job: JobListing) {
    if (
      isDuplicateApplication(duplicateCheckApplications, job.company_name, job.title)
    ) {
      return
    }

    const now = new Date().toISOString()
    const application: Application = {
      id: crypto.randomUUID(),
      jobId: job.id,
      company: job.company_name,
      role: job.title,
      workMode: 'Remote',
      status: 'WISHLIST',
      requiredSkills: job.tags,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: 'Lamaran disimpan ke Wishlist.',
        },
      ],
    }

    addApplication(application)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Aku Mw Magang beranda">
          <span className="brand-mark" aria-hidden="true">
            AM
          </span>
          <span>Aku Mw Magang</span>
        </a>
        <nav className="feature-nav" aria-label="Navigasi utama">
          <button type="button" aria-pressed={activePage === 'explore'} onClick={() => setActivePage('explore')}>Eksplorasi Lowongan</button>
          <button type="button" aria-pressed={activePage === 'pipeline'} onClick={() => setActivePage('pipeline')}>Pipeline ({applications.length})</button>
          <button type="button" aria-pressed={activePage === 'offers'} onClick={() => setActivePage('offers')}>Bandingkan Offer</button>
        </nav>
        <div className="topbar-actions">
          <span className="application-count">
            Pipeline Lamaran <strong>{applications.length}</strong>
          </span>
          <button
            className="button button-primary"
            onClick={() => setShowManualForm((visible) => !visible)}
            type="button"
          >
            + Catat Lamaran
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="page-heading">
          <div>
            <p className="eyebrow">RUANG KERJA KAPTEN</p>
            <h1>{activePage === 'explore' ? 'Eksplorasi Lowongan' : activePage === 'pipeline' ? 'Pipeline Lamaran' : 'Offer Comparator'}</h1>
            <p className="heading-copy">
              {activePage === 'explore' ? 'Temukan posisi magang yang cocok dengan skill dan catat setiap lamaran dengan rapi.' : activePage === 'pipeline' ? 'Kelola lamaran dan siapkan wawancara.' : 'Bandingkan tawaran magang berdasarkan skor berbobot.'}
            </p>
          </div>
          <div className="result-count" aria-live="polite">
            {activePage === 'explore' && loadState === 'ready' ? `${filteredJobs.length} lowongan` : ''}
          </div>
        </section>

        {(skillsStorageError || applicationsStorageError) && (
          <div className="notice notice-error" role="alert">
            {skillsStorageError || applicationsStorageError}
          </div>
        )}

        <DashboardStats applications={applications} />

        {showManualForm && (
          <ManualApplicationForm
            applications={duplicateCheckApplications}
            onClose={() => setShowManualForm(false)}
            onSubmit={createApplication}
          />
        )}

        {activePage === 'pipeline' && <FeatureDemoPipeline applications={applications} skills={skills} onUpdate={updateApplication} onDelete={deleteApplication} />}
        {activePage === 'offers' && <OfferComparator applications={applications} skills={skills} />}
        {activePage === 'explore' && <div className="explorer-layout">
          <aside className="sidebar">
            <SkillProfile skills={skills} onChange={setSkills} />
            <section className="sidebar-section source-section">
              <h2>Sumber Data Lowongan</h2>
              <label className="radio-option">
                <input
                  checked={source === 'remote'}
                  name="job-source"
                  onChange={() => setSource('remote')}
                  type="radio"
                />
                <span>Remotive API (Live)</span>
              </label>
              <label className="radio-option">
                <input
                  checked={source === 'local'}
                  name="job-source"
                  onChange={() => setSource('local')}
                  type="radio"
                />
                <span>Dataset Magang ID (Lokal)</span>
              </label>
              <p className="source-note">
                {effectiveSource === 'remote'
                  ? 'Terhubung ke lowongan Remotive.'
                  : 'Menggunakan dataset lokal 15 lowongan.'}
              </p>
            </section>
          </aside>

          <section className="job-explorer" aria-label="Daftar lowongan">
            <div className="filter-bar">
              <label className="search-field">
                <span className="visually-hidden">Cari posisi atau perusahaan</span>
                <span aria-hidden="true" className="search-icon">
                  ⌕
                </span>
                <input
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  placeholder="Cari posisi atau perusahaan..."
                  type="search"
                  value={search}
                />
              </label>
              <label className="select-field">
                <span className="visually-hidden">Filter kategori</span>
                <select
                  onChange={(event) => setCategory(event.currentTarget.value)}
                  value={category}
                >
                  <option value="All categories">Semua Kategori</option>
                  {categories.map((jobCategory) => (
                    <option key={jobCategory} value={jobCategory}>
                      {jobCategory}
                    </option>
                  ))}
                </select>
              </label>
              <span className="sort-label">Match Tertinggi</span>
            </div>

            {loadMessage && (
              <div
                className={`notice ${loadState === 'error' ? 'notice-error' : 'notice-warning'}`}
                role={loadState === 'error' ? 'alert' : 'status'}
              >
                <span>{loadMessage}</span>
                <div className="notice-actions">
                  {(loadState === 'error' ||
                    (source === 'remote' && effectiveSource === 'local')) && (
                    <button
                      className="text-button"
                      onClick={() => setRetryCount((count) => count + 1)}
                      type="button"
                    >
                      {loadState === 'error' ? 'Coba Lagi' : 'Coba Lagi API'}
                    </button>
                  )}
                  {loadState === 'ready' &&
                    source === 'remote' &&
                    effectiveSource === 'local' && (
                      <button
                        className="text-button"
                        onClick={() => setSource('local')}
                        type="button"
                      >
                        Gunakan Dataset Lokal
                      </button>
                    )}
                  {loadState === 'error' && source === 'remote' && (
                    <button
                      className="text-button"
                      onClick={() => setSource('local')}
                      type="button"
                    >
                      Gunakan Dataset Lokal
                    </button>
                  )}
                  {loadState === 'error' && source === 'local' && (
                    <button
                      className="text-button"
                      onClick={() => setSource('remote')}
                      type="button"
                    >
                      Coba API Remotive
                    </button>
                  )}
                </div>
              </div>
            )}

            {loadState === 'loading' && (
              <div className="state-card" role="status">
                <span className="loader" aria-hidden="true" />
                <h2>Memuat lowongan...</h2>
                <p>Sedang mengambil daftar posisi yang tersedia.</p>
              </div>
            )}

            {loadState === 'error' && (
              <div className="state-card state-error">
                <h2>Lowongan belum dapat dimuat</h2>
                <p>Periksa koneksi atau coba lagi beberapa saat.</p>
              </div>
            )}

            {loadState === 'ready' && filteredJobs.length === 0 && (
              <div className="state-card">
                <h2>Tidak ada lowongan yang cocok</h2>
                <p>Coba ubah kata pencarian atau pilih kategori lain.</p>
              </div>
            )}

            {loadState === 'ready' && filteredJobs.length > 0 && (
              <div className="job-grid">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    candidateSkills={skills}
                    matchScore={calculateSkillMatch(skills, job.tags)}
                    alreadyApplied={isDuplicateApplication(
                      duplicateCheckApplications,
                      job.company_name,
                      job.title,
                    )}
                    onSave={() => saveToWishlist(job)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>}
      </main>
      {pending && <UndoToast key={pending.application.id} company={pending.application.company} expiresAt={pending.expiresAt} onUndo={undoDelete} />}
    </div>
  )
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Kesalahan tidak diketahui'
}

export default App
