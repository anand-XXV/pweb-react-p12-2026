import { useEffect, useState } from 'react'

interface Props {
  company: string
  expiresAt: number
  onUndo: () => void
}

export function UndoToast({ company, expiresAt, onUndo }: Props) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))
    }, 100)
    return () => window.clearInterval(timer)
  }, [expiresAt])

  return (
    <aside className="undo-toast" aria-label="Urungkan penghapusan">
      <span role="status">Lamaran {company} telah dihapus.</span>
      <button className="button button-primary" type="button" onClick={onUndo} disabled={seconds === 0}>Undo ({seconds}s)</button>
    </aside>
  )
}
