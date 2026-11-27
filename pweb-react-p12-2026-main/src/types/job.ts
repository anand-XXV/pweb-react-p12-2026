export interface JobListing {
  id: number | string
  title: string
  company_name: string
  category: string
  candidate_required_location: string
  salary: string
  tags: string[]
  url?: string
  job_type?: string
  publication_date?: string
  description?: string
}
