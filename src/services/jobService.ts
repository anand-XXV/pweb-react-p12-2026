import type { JobListing } from '../types/job'

const REMOTIVE_API_URL =
  'https://remotive.com/api/remote-jobs?category=software-dev&limit=30'
const LOCAL_DATA_URL = '/magang-fallback.json'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseJob(value: unknown): JobListing | null {
  if (
    !isRecord(value) ||
    (typeof value.id !== 'number' && typeof value.id !== 'string') ||
    typeof value.title !== 'string' ||
    typeof value.company_name !== 'string' ||
    typeof value.category !== 'string'
  ) {
    return null
  }

  return {
    id: value.id,
    title: value.title,
    company_name: value.company_name,
    category: value.category,
    candidate_required_location:
      typeof value.candidate_required_location === 'string'
        ? value.candidate_required_location
        : 'Remote',
    salary: typeof value.salary === 'string' ? value.salary : 'Tidak dicantumkan',
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    ...(typeof value.url === 'string' ? { url: value.url } : {}),
    ...(typeof value.job_type === 'string' ? { job_type: value.job_type } : {}),
    ...(typeof value.publication_date === 'string'
      ? { publication_date: value.publication_date }
      : {}),
    ...(typeof value.description === 'string'
      ? { description: value.description }
      : {}),
  }
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Permintaan gagal dengan status ${response.status}.`)
  }

  return response.json() as Promise<unknown>
}

export async function fetchRemoteJobs(
  signal: AbortSignal,
): Promise<JobListing[]> {
  const response = await fetchJson(REMOTIVE_API_URL, signal)
  if (!isRecord(response) || !Array.isArray(response.jobs)) {
    throw new Error('Format respons Remotive tidak sesuai.')
  }

  const jobs = response.jobs.map(parseJob).filter((job) => job !== null)
  if (jobs.length === 0) {
    throw new Error('API Remotive tidak mengembalikan lowongan yang valid.')
  }

  return jobs
}

export async function fetchFallbackJobs(
  signal: AbortSignal,
): Promise<JobListing[]> {
  const response = await fetchJson(LOCAL_DATA_URL, signal)
  if (!Array.isArray(response)) {
    throw new Error('Format dataset lokal tidak sesuai.')
  }

  const jobs = response.map(parseJob).filter((job) => job !== null)
  if (jobs.length === 0) {
    throw new Error('Dataset lokal tidak memiliki lowongan yang valid.')
  }

  return jobs
}
