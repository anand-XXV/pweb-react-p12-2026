import { useCallback, useRef, useState } from 'react'
import type { SetStateAction } from 'react'

interface StoredValue<T> {
  value: T
  error: string | null
}

function readStoredValue<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): StoredValue<T> {
  try {
    const rawValue = window.localStorage.getItem(key)
    if (rawValue === null) return { value: initialValue, error: null }

    const parsedValue: unknown = JSON.parse(rawValue)
    if (!isValid(parsedValue)) {
      return {
        value: initialValue,
        error: `Data lokal "${key}" tidak valid. Nilai awal digunakan.`,
      }
    }

    return { value: parsedValue, error: null }
  } catch (error) {
    console.error(`Gagal membaca localStorage "${key}".`, error)
    return {
      value: initialValue,
      error: `Data "${key}" tidak dapat dibaca dari penyimpanan lokal.`,
    }
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
) {
  const [storedValue] = useState(() =>
    readStoredValue(key, initialValue, isValid),
  )
  const [value, setValue] = useState(storedValue.value)
  const [error, setError] = useState(storedValue.error)
  const valueRef = useRef(value)

  const updateValue = useCallback(
    (action: SetStateAction<T>) => {
      const nextValue =
        typeof action === 'function'
          ? (action as (previousValue: T) => T)(valueRef.current)
          : action

      valueRef.current = nextValue
      setValue(nextValue)

      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue))
        setError(null)
      } catch (storageError) {
        console.error(`Gagal menyimpan localStorage "${key}".`, storageError)
        setError(`Perubahan tidak dapat disimpan ke penyimpanan lokal (${key}).`)
      }
    },
    [key],
  )

  return { value, setValue: updateValue, error }
}
