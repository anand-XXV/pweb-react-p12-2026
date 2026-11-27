import { useState } from 'react'
import type { Application } from '../types/application'
import { calculateOfferScore } from '../utils/offerScore'

interface Props {
  applications: readonly Application[]
  skills: readonly string[]
}

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export function OfferComparator({ applications, skills }: Props) {
  const [selectedA, setSelectedA] = useState('')
  const [selectedB, setSelectedB] = useState('')
  const offers = applications.filter((application) => application.status === 'OFFER')
  const offerA = offers.find((offer) => offer.id === selectedA) ?? offers[0]
  const offerB = offers.find((offer) => offer.id === selectedB && offer.id !== offerA?.id) ?? offers.find((offer) => offer.id !== offerA?.id)

  if (!offerA || !offerB) return (
    <section className="state-card">
      <h2>Belum cukup offer untuk dibandingkan</h2>
      <p>Minimal 2 lamaran berstatus OFFER. Saat ini tersedia {offers.length} offer.</p>
    </section>
  )

  const maxSalary = Math.max(offerA.salaryOffer ?? 0, offerB.salaryOffer ?? 0)
  const scoreA = calculateOfferScore(offerA, skills, maxSalary)
  const scoreB = calculateOfferScore(offerB, skills, maxSalary)
  const tie = Math.abs(scoreA.total - scoreB.total) < 1e-9
  const winnerId = tie ? null : scoreA.total > scoreB.total ? offerA.id : offerB.id

  return (
    <section className="feature-panel comparator-panel" aria-label="Offer Comparator">
      <div className="feature-panel-heading">
        <div><h2>Bandingkan Offer Magang</h2><p>Gaji 50% · Mode kerja 25% · Kecocokan skill 25%</p></div>
        <div className="offer-selects">
          <label className="form-field">Offer A
            <select value={offerA.id} onChange={(event) => setSelectedA(event.currentTarget.value)}>
              {offers.map((offer) => <option key={offer.id} value={offer.id} disabled={offer.id === offerB.id}>{offer.company} — {offer.role}</option>)}
            </select>
          </label>
          <label className="form-field">Offer B
            <select value={offerB.id} onChange={(event) => setSelectedB(event.currentTarget.value)}>
              {offers.map((offer) => <option key={offer.id} value={offer.id} disabled={offer.id === offerA.id}>{offer.company} — {offer.role}</option>)}
            </select>
          </label>
          <button className="button button-secondary" type="button" onClick={() => { setSelectedA(offerB.id); setSelectedB(offerA.id) }}>Tukar A/B</button>
        </div>
      </div>
      {tie && <p className="notice notice-warning" role="status">Kedua offer memiliki skor yang sama.</p>}
      <div className="offer-grid">
        {[{ offer: offerA, score: scoreA }, { offer: offerB, score: scoreB }].map(({ offer, score }) => (
          <article className={`offer-card ${offer.id === winnerId ? 'offer-winner' : ''}`} key={offer.id}>
            {offer.id === winnerId && <span className="offer-badge">Rekomendasi Terbaik</span>}
            <h3>{offer.company}</h3><p>{offer.role}</p>
            <dl>
              <div><dt>Gaji per bulan</dt><dd>{rupiah.format(score.salary)}<small>{score.salaryPoints.toFixed(1)} / 50</small></dd></div>
              <div><dt>Mode kerja</dt><dd>{offer.workMode} ({score.modeScore})<small>{score.modePoints.toFixed(1)} / 25</small></dd></div>
              <div><dt>Skill Match</dt><dd>{score.match}%<small>{score.skillPoints.toFixed(1)} / 25</small></dd></div>
            </dl>
            <div className="offer-total"><span>Total Skor Berbobot</span><strong>{score.total.toFixed(1)}</strong></div>
          </article>
        ))}
      </div>
    </section>
  )
}
