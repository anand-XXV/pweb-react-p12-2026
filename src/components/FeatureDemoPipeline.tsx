import { useState } from 'react'
import type { Application, ApplicationStatus, WorkMode } from '../types/application'
import { calculateSkillMatch } from '../utils/jobUtils'
import { isGhostingRisk } from '../utils/statistics'
import { InterviewPrepTimer } from './InterviewPrepTimer'

// Panel sementara agar fitur 5–7 bisa diuji sebelum pipeline dan detail (fitur 3–4) digabung.
// Ganti panel ini dengan komponen resmi anggota tim; tetap gunakan state App yang sama.
const transitions: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  WISHLIST: ['APPLIED'],
  APPLIED: ['SCREENING', 'REJECTED', 'GHOSTED'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'GHOSTED'],
  INTERVIEW: ['OFFER', 'REJECTED', 'GHOSTED'],
  OFFER: [], REJECTED: [], GHOSTED: ['SCREENING'],
}

type Update = (id: string, updater: (application: Application) => Application) => void
interface Props {
  applications: readonly Application[]
  skills: readonly string[]
  onUpdate: Update
  onDelete: (id: string) => void
}

export function FeatureDemoPipeline({ applications, skills, onUpdate, onDelete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = applications.find((application) => application.id === selectedId)
  if (!applications.length) return <section className="state-card"><h2>Belum ada lamaran</h2><p>Simpan lowongan ke Wishlist atau catat lamaran secara manual.</p></section>
  return (
    <section className="feature-panel">
      <div className="feature-panel-heading"><h2>Pipeline Lamaran</h2><span>{applications.length} lamaran</span></div>
      <div className="demo-list">
        {applications.map((application) => (
          <article className="demo-row" key={application.id}>
            <div><h3>{application.company} — {application.role}</h3><p>{application.status} · {calculateSkillMatch(skills, application.requiredSkills)}% Match · Checklist {application.checklist.filter((item) => item.done).length}/{application.checklist.length}</p>{isGhostingRisk(application) && <span className="feature-danger">Rawan Ghosting</span>}</div>
            <div className="feature-actions">
              <button className="button button-secondary" type="button" onClick={() => setSelectedId(application.id)}>Detail</button>
              {(application.status === 'APPLIED' || application.status === 'SCREENING') && <button className="button button-secondary" type="button" onClick={() => onUpdate(application.id, (current) => ({ ...current, lastUpdatedAt: new Date(Date.parse(current.lastUpdatedAt) - 15 * 86400000).toISOString() }))}>Simulasi +15 Hari</button>}
              <button className="button button-secondary feature-danger" type="button" onClick={() => { if (selectedId === application.id) setSelectedId(null); onDelete(application.id) }}>Hapus</button>
            </div>
          </article>
        ))}
      </div>
      {selected && <DemoDetail key={selected.id} application={selected} onUpdate={onUpdate} onClose={() => setSelectedId(null)} />}
    </section>
  )
}

function DemoDetail({ application, onUpdate, onClose }: { application: Application; onUpdate: Update; onClose: () => void }) {
  const [target, setTarget] = useState<ApplicationStatus | ''>('')
  const [cv, setCv] = useState(application.cvVersion ?? '')
  const [date, setDate] = useState(application.appliedDate ?? '')
  const [interview, setInterview] = useState(application.interviewDateTime ?? '')
  const [salary, setSalary] = useState(String(application.salaryOffer ?? ''))
  const [mode, setMode] = useState<WorkMode>(application.workMode)
  const [checklistText, setChecklistText] = useState('')
  const [error, setError] = useState('')

  function changeStatus() {
    if (!target || !transitions[application.status].includes(target)) return
    if (target === 'APPLIED' && (!cv.trim() || !date)) { setError('CV dan tanggal melamar wajib diisi.'); return }
    if (target === 'INTERVIEW' && !interview) { setError('Jadwal interview wajib diisi.'); return }
    if (target === 'OFFER' && (!Number.isFinite(Number(salary)) || Number(salary) <= 0)) { setError('Gaji offer harus lebih dari 0.'); return }
    const timestamp = new Date().toISOString()
    onUpdate(application.id, (current) => ({
      ...current,
      status: target,
      ...(target === 'APPLIED' ? { cvVersion: cv.trim(), appliedDate: date } : {}),
      ...(target === 'INTERVIEW' ? { interviewDateTime: interview } : {}),
      ...(target === 'OFFER' ? { salaryOffer: Number(salary), workMode: mode } : {}),
      lastUpdatedAt: timestamp,
      activityLogs: [...current.activityLogs, { id: crypto.randomUUID(), timestamp, message: `Status ${current.status} → ${target}` }],
    }))
    setTarget(''); setError('')
  }

  function addChecklist() {
    const text = checklistText.trim()
    if (!text) return
    const item = { id: crypto.randomUUID(), text, done: false }
    onUpdate(application.id, (current) => ({ ...current, checklist: [...current.checklist, item] }))
    setChecklistText('')
  }

  return (
    <div className="demo-detail">
      <div className="feature-panel-heading"><div><h2>{application.company}</h2><p>{application.role} · {application.status}</p></div><button className="button button-secondary" type="button" onClick={onClose}>Tutup Detail</button></div>
      <div className="demo-detail-grid">
        <div>
          {transitions[application.status].length > 0 && <form className="demo-fields" onSubmit={(event) => { event.preventDefault(); changeStatus() }}>
            <label className="form-field">Pindah status ke<select value={target} onChange={(event) => { setTarget(event.currentTarget.value as ApplicationStatus | ''); setError('') }}><option value="">Pilih status</option>{transitions[application.status].map((status) => <option key={status}>{status}</option>)}</select></label>
            {target === 'APPLIED' && <><label className="form-field">Versi CV<input value={cv} onChange={(event) => setCv(event.currentTarget.value)} required /></label><label className="form-field">Tanggal melamar<input type="date" value={date} onChange={(event) => setDate(event.currentTarget.value)} required /></label></>}
            {target === 'INTERVIEW' && <label className="form-field">Jadwal Interview<input type="datetime-local" value={interview} onChange={(event) => setInterview(event.currentTarget.value)} required /></label>}
            {target === 'OFFER' && <><label className="form-field">Gaji offer (Rp)<input type="number" min="1" value={salary} onChange={(event) => setSalary(event.currentTarget.value)} required /></label><label className="form-field">Mode kerja<select value={mode} onChange={(event) => setMode(event.currentTarget.value as WorkMode)}><option>Remote</option><option>Hybrid</option><option>Onsite</option></select></label></>}
            {error && <p role="alert" className="feature-danger">{error}</p>}
            <button className="button button-primary" type="submit" disabled={!target}>Konfirmasi Status</button>
          </form>}
          <h3>Checklist Persiapan</h3>
          {application.checklist.map((item) => <label className="demo-check" key={item.id}><input type="checkbox" checked={item.done} onChange={() => onUpdate(application.id, (current) => ({ ...current, checklist: current.checklist.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry) }))} />{item.text}</label>)}
          <form className="add-skill-form" onSubmit={(event) => { event.preventDefault(); addChecklist() }}><input aria-label="Checklist baru" placeholder="Tambah checklist" value={checklistText} onChange={(event) => setChecklistText(event.currentTarget.value)} /><button className="button button-primary" type="submit">Tambah</button></form>
          <h3>Riwayat Aktivitas</h3><ul className="demo-logs">{application.activityLogs.map((log) => <li key={log.id}>{log.message}</li>)}</ul>
        </div>
        <InterviewPrepTimer />
      </div>
    </div>
  )
}
