import { useEffect, useState } from 'react'

const questions = [
  'Ceritakan tentang dirimu dan alasan ingin mengikuti magang di bidang IT.',
  'Jelaskan perbedaan state dan props pada React.',
  'Bagaimana cara kamu mencari dan memperbaiki bug pada sebuah aplikasi?',
  'Ceritakan pengalaman mengerjakan project bersama tim dan menghadapi konflik.',
  'Bagaimana cara kamu mempelajari teknologi baru ketika diberi tugas yang belum pernah dikerjakan?',
]
const duration = 120

export function InterviewPrepTimer() {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [seconds, setSeconds] = useState(duration)
  const [running, setRunning] = useState(false)
  const isRunning = running && seconds > 0

  useEffect(() => {
    if (!isRunning) return
    const intervalId = window.setInterval(() => {
      setSeconds((previous) => Math.max(0, previous - 1))
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [isRunning])

  function reset() {
    setRunning(false)
    setSeconds(duration)
  }

  function nextQuestion() {
    setQuestionIndex((previous) => (previous + 1) % questions.length)
    reset()
  }

  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <section className="feature-panel interview-prep" aria-label="Latihan interview">
      <div className="feature-panel-heading">
        <h3>Latihan Interview</h3>
        <span>Soal {questionIndex + 1}/{questions.length}</span>
      </div>
      <p>{questions[questionIndex]}</p>
      <div className={`prep-clock ${seconds === 0 ? 'feature-danger' : ''}`} aria-label={`Sisa waktu ${time}`}>{time}</div>
      {seconds === 0 && <p role="status" className="feature-danger">Waktu habis! Reset atau lanjut ke soal berikutnya.</p>}
      <div className="feature-actions">
        <button className="button button-primary" type="button" disabled={seconds === 0} onClick={() => setRunning((previous) => !previous)}>{isRunning ? 'Pause' : 'Start'}</button>
        <button className="button button-secondary" type="button" onClick={reset}>Reset</button>
        <button className="button button-secondary" type="button" onClick={nextQuestion}>Soal Berikutnya</button>
      </div>
    </section>
  )
}
