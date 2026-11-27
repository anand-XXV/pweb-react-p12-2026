import { useRef, useState } from 'react'
import type { FormEvent, RefObject } from 'react'
import type {
  Application,
  ApplicationDraft,
  ApplicationStatus,
  WorkMode,
} from '../types/application'
import { isDuplicateApplication } from '../utils/jobUtils'

interface ManualApplicationFormProps {
  applications: readonly Application[]
  onSubmit: (draft: ApplicationDraft) => void
  onClose: () => void
}

type FormField =
  | 'company'
  | 'role'
  | 'workMode'
  | 'status'
  | 'requiredSkills'
  | 'cvVersion'
  | 'appliedDate'

const initialFormValues = {
  company: '',
  role: '',
  workMode: '' as WorkMode | '',
  status: 'WISHLIST' as ApplicationStatus,
  requiredSkills: '',
  cvVersion: '',
  appliedDate: '',
}

export function ManualApplicationForm({
  applications,
  onSubmit,
  onClose,
}: ManualApplicationFormProps) {
  const [formValues, setFormValues] = useState(initialFormValues)
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({})
  const companyRef = useRef<HTMLInputElement>(null)
  const roleRef = useRef<HTMLInputElement>(null)
  const workModeRef = useRef<HTMLSelectElement>(null)
  const statusRef = useRef<HTMLSelectElement>(null)
  const skillsRef = useRef<HTMLInputElement>(null)
  const cvVersionRef = useRef<HTMLInputElement>(null)
  const appliedDateRef = useRef<HTMLInputElement>(null)

  function updateField<Field extends keyof typeof initialFormValues>(
    field: Field,
    value: (typeof initialFormValues)[Field],
  ) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Partial<Record<FormField, string>> = {}
    const company = formValues.company.trim()
    const role = formValues.role.trim()
    const requiredSkills = formValues.requiredSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    if (!company) nextErrors.company = 'Nama perusahaan wajib diisi.'
    if (!role) nextErrors.role = 'Posisi atau role wajib diisi.'
    if (!formValues.workMode) nextErrors.workMode = 'Pilih mode kerja.'
    if (!formValues.status) nextErrors.status = 'Pilih status awal.'
    if (requiredSkills.length === 0) {
      nextErrors.requiredSkills = 'Masukkan minimal satu skill yang dibutuhkan.'
    }

    if (
      company &&
      role &&
      isDuplicateApplication(applications, company, role)
    ) {
      nextErrors.company = 'Lamaran untuk perusahaan dan posisi ini sudah ada.'
    }

    if (formValues.status === 'APPLIED') {
      if (!formValues.cvVersion.trim()) {
        nextErrors.cvVersion = 'Versi CV wajib diisi untuk status Applied.'
      }
      if (!formValues.appliedDate) {
        nextErrors.appliedDate = 'Tanggal melamar wajib diisi.'
      }
    }

    setErrors(nextErrors)

    const firstInvalidField = Object.keys(nextErrors)[0] as FormField | undefined
    if (firstInvalidField) {
      const fieldRefs: Record<
        FormField,
        RefObject<HTMLInputElement | HTMLSelectElement | null>
      > = {
        company: companyRef,
        role: roleRef,
        workMode: workModeRef,
        status: statusRef,
        requiredSkills: skillsRef,
        cvVersion: cvVersionRef,
        appliedDate: appliedDateRef,
      }
      fieldRefs[firstInvalidField].current?.focus()
      return
    }

    const draft: ApplicationDraft = {
      company,
      role,
      workMode: formValues.workMode as WorkMode,
      status: formValues.status,
      requiredSkills: [...new Set(requiredSkills)],
      ...(formValues.status === 'APPLIED'
        ? {
            cvVersion: formValues.cvVersion.trim(),
            appliedDate: formValues.appliedDate,
          }
        : {}),
    }

    onSubmit(draft)
    setFormValues(initialFormValues)
  }

  return (
    <section className="manual-form-panel" aria-labelledby="manual-form-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CATAT LAMARAN</p>
          <h2 id="manual-form-heading">Tambah Lamaran Manual</h2>
        </div>
        <button
          aria-label="Tutup formulir"
          className="close-button"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>

      <form className="application-form" noValidate onSubmit={submitForm}>
        <div className="form-grid">
          <label className="form-field">
            <span>Perusahaan</span>
            <input
              ref={companyRef}
              aria-invalid={Boolean(errors.company)}
              onChange={(event) => updateField('company', event.currentTarget.value)}
              placeholder="Contoh: Nusantara Cloud"
              value={formValues.company}
            />
            {errors.company && <span className="field-error">{errors.company}</span>}
          </label>

          <label className="form-field">
            <span>Posisi / Role</span>
            <input
              ref={roleRef}
              aria-invalid={Boolean(errors.role)}
              onChange={(event) => updateField('role', event.currentTarget.value)}
              placeholder="Contoh: Frontend Intern"
              value={formValues.role}
            />
            {errors.role && <span className="field-error">{errors.role}</span>}
          </label>

          <label className="form-field">
            <span>Mode Kerja</span>
            <select
              ref={workModeRef}
              aria-invalid={Boolean(errors.workMode)}
              onChange={(event) =>
                updateField('workMode', event.currentTarget.value as WorkMode | '')
              }
              value={formValues.workMode}
            >
              <option value="">Pilih mode kerja</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
            {errors.workMode && (
              <span className="field-error">{errors.workMode}</span>
            )}
          </label>

          <label className="form-field">
            <span>Status Awal</span>
            <select
              ref={statusRef}
              aria-invalid={Boolean(errors.status)}
              onChange={(event) => {
                const status = event.currentTarget.value as ApplicationStatus
                updateField('status', status)
                if (status === 'APPLIED' && !formValues.appliedDate) {
                  updateField(
                    'appliedDate',
                    new Date().toISOString().slice(0, 10),
                  )
                }
              }}
              value={formValues.status}
            >
              <option value="WISHLIST">WISHLIST</option>
              <option value="APPLIED">APPLIED</option>
            </select>
            {errors.status && <span className="field-error">{errors.status}</span>}
          </label>

          <label className="form-field form-field-wide">
            <span>Required Skills</span>
            <input
              ref={skillsRef}
              aria-invalid={Boolean(errors.requiredSkills)}
              onChange={(event) =>
                updateField('requiredSkills', event.currentTarget.value)
              }
              placeholder="Pisahkan dengan koma, contoh: React, TypeScript, CSS"
              value={formValues.requiredSkills}
            />
            {errors.requiredSkills && (
              <span className="field-error">{errors.requiredSkills}</span>
            )}
          </label>

          {formValues.status === 'APPLIED' && (
            <>
              <label className="form-field">
                <span>Versi CV</span>
                <input
                  ref={cvVersionRef}
                  aria-invalid={Boolean(errors.cvVersion)}
                  onChange={(event) =>
                    updateField('cvVersion', event.currentTarget.value)
                  }
                  placeholder="Contoh: CV-Frontend-v2"
                  value={formValues.cvVersion}
                />
                {errors.cvVersion && (
                  <span className="field-error">{errors.cvVersion}</span>
                )}
              </label>

              <label className="form-field">
                <span>Tanggal Melamar</span>
                <input
                  ref={appliedDateRef}
                  aria-invalid={Boolean(errors.appliedDate)}
                  onChange={(event) =>
                    updateField('appliedDate', event.currentTarget.value)
                  }
                  type="date"
                  value={formValues.appliedDate}
                />
                {errors.appliedDate && (
                  <span className="field-error">{errors.appliedDate}</span>
                )}
              </label>
            </>
          )}
        </div>

        <div className="form-actions">
          <button className="button button-secondary" onClick={onClose} type="button">
            Batal
          </button>
          <button className="button button-primary" type="submit">
            Simpan Lamaran
          </button>
        </div>
      </form>
    </section>
  )
}
