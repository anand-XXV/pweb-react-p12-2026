import type { Application } from '../types/application'
import { calculateStatistics } from '../utils/statistics'

export function DashboardStats({ applications }: { applications: readonly Application[] }) {
  // Derived state: tidak ada useState untuk kelima kartu statistik.
  const stats = calculateStatistics(applications)
  const cards = [
    { label: 'Total Lamaran', value: stats.total, description: 'Lamaran di pipeline', tone: '' },
    { label: 'Response Rate', value: `${stats.responseRate}%`, description: `${stats.responded} dari ${stats.total} lamaran`, tone: '' },
    { label: 'Interview Rate', value: `${stats.interviewRate}%`, description: `${stats.interviewed} masuk wawancara`, tone: '' },
    { label: 'Rawan Ghosting', value: stats.ghosting, description: 'Lebih dari 14 hari tanpa update', tone: 'feature-danger' },
    { label: 'Total Offer', value: stats.offers, description: 'Tawaran diterima', tone: 'feature-success' },
  ]
  return (
    <section className="dashboard-stats" aria-label="Statistik lamaran">
      {cards.map((card) => (
        <article className="stat-card" key={card.label}>
          <h2>{card.label}</h2>
          <strong className={card.tone}>{card.value}</strong>
          <p>{card.description}</p>
        </article>
      ))}
    </section>
  )
}
