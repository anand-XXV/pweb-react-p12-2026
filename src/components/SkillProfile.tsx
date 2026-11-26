import { useState } from 'react'
import type { FormEvent } from 'react'

interface SkillProfileProps {
  skills: string[]
  onChange: (skills: string[]) => void
}

export function SkillProfile({ skills, onChange }: SkillProfileProps) {
  const [newSkill, setNewSkill] = useState('')
  const [error, setError] = useState<string | null>(null)

  function addSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedSkill = newSkill.trim()

    if (!trimmedSkill) {
      setError('Masukkan nama skill terlebih dahulu.')
      return
    }

    if (
      skills.some(
        (skill) => skill.toLocaleLowerCase() === trimmedSkill.toLocaleLowerCase(),
      )
    ) {
      setError('Skill tersebut sudah ada di profil.')
      return
    }

    onChange([...skills, trimmedSkill])
    setNewSkill('')
    setError(null)
  }

  function removeSkill(skillToRemove: string) {
    onChange(skills.filter((skill) => skill !== skillToRemove))
    setError(null)
  }

  return (
    <section className="sidebar-section skill-profile">
      <div className="section-title-row">
        <div>
          <h2>Profil Skill Kapten</h2>
          <p>Skill ini digunakan untuk menghitung kecocokan lowongan.</p>
        </div>
        <span className="skill-count">{skills.length}</span>
      </div>

      <form className="add-skill-form" onSubmit={addSkill}>
        <label className="visually-hidden" htmlFor="new-skill">
          Tambah skill
        </label>
        <input
          id="new-skill"
          onChange={(event) => {
            setNewSkill(event.currentTarget.value)
            setError(null)
          }}
          placeholder="Tambah skill..."
          value={newSkill}
        />
        <button className="button button-dark" type="submit">
          Tambah
        </button>
      </form>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      <ul className="skill-list" aria-label="Skill tersimpan">
        {skills.map((skill) => (
          <li className="skill-chip" key={skill}>
            <span>{skill}</span>
            <button
              aria-label={`Hapus skill ${skill}`}
              className="remove-skill"
              onClick={() => removeSkill(skill)}
              type="button"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
