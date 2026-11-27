import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Application } from '../types/application'

interface PendingDeletion {
  application: Application
  index: number
  expiresAt: number
}

export function useUndoDelete(
  applications: Application[],
  setApplications: Dispatch<SetStateAction<Application[]>>,
) {
  const [pending, setPending] = useState<PendingDeletion | null>(null)
  const pendingRef = useRef<PendingDeletion | null>(null)
  const timeoutRef = useRef<number | null>(null)

  function clearTimer() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  function deleteApplication(id: string) {
    const index = applications.findIndex((application) => application.id === id)
    const application = applications[index]
    if (!application) return

    clearTimer()
    const deletion = { application, index, expiresAt: Date.now() + 5000 }
    pendingRef.current = deletion
    setPending(deletion)
    setApplications((current) => current.filter((item) => item.id !== id))
    timeoutRef.current = window.setTimeout(() => {
      pendingRef.current = null
      timeoutRef.current = null
      setPending(null)
    }, 5000)
  }

  function undoDelete() {
    const deletion = pendingRef.current
    if (!deletion) return
    clearTimer()
    pendingRef.current = null
    setPending(null)
    if (Date.now() >= deletion.expiresAt) return

    // Kembalikan objek utuh, termasuk checklist dan activityLogs.
    setApplications((current) => {
      if (current.some((item) => item.id === deletion.application.id)) return current
      const index = Math.min(deletion.index, current.length)
      return [...current.slice(0, index), deletion.application, ...current.slice(index)]
    })
  }

  return { pending, deleteApplication, undoDelete }
}
