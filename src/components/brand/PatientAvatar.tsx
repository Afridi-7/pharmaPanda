import { cn } from '@/lib/utils'
import type { Patient } from '@/types'

/** Warm, muted illustration palette — no photography, no clip-art. */
const looks: Record<
  Patient['avatar'],
  { skin: string; hair: string; garment: string; hairStyle: 'short' | 'bob' | 'bun' | 'wrap' | 'crop' | 'grey' }
> = {
  sarah: { skin: '#E8C6AC', hair: '#6E4B34', garment: '#A8B9A3', hairStyle: 'bob' },
  thomas: { skin: '#E3BFA3', hair: '#8A8579', garment: '#C98267', hairStyle: 'grey' },
  amina: { skin: '#B98A63', hair: '#2E2723', garment: '#E7C979', hairStyle: 'wrap' },
  george: { skin: '#E6C7AE', hair: '#9A9489', garment: '#5F8068', hairStyle: 'grey' },
  lena: { skin: '#EBD0B8', hair: '#C08A45', garment: '#A8B9A3', hairStyle: 'bun' },
  mateo: { skin: '#C99A72', hair: '#3A2A21', garment: '#374A41', hairStyle: 'crop' },
  ruth: { skin: '#E9CDB6', hair: '#B7B0A3', garment: '#C98267', hairStyle: 'bob' },
  nadia: { skin: '#A9784F', hair: '#241D1A', garment: '#5F8068', hairStyle: 'wrap' },
}

interface PatientAvatarProps {
  avatar: Patient['avatar']
  size?: number
  className?: string
  name?: string
}

export function PatientAvatar({ avatar, size = 56, className, name }: PatientAvatarProps) {
  const look = looks[avatar] ?? looks.sarah
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={name ? `Illustration of ${name}` : 'Patient illustration'}
      className={cn('shrink-0 rounded-full border border-beige bg-cream', className)}
    >
      <circle cx="50" cy="50" r="50" fill="#F7F3EA" />
      {/* shoulders / garment */}
      <path d="M14 100 q6-24 36-24 t36 24 z" fill={look.garment} />
      <path d="M50 76 q-8 8 0 24 q8-16 0-24" fill="#FCFBF7" opacity="0.45" />
      {/* neck */}
      <rect x="44" y="60" width="12" height="16" rx="6" fill={look.skin} />
      {/* head */}
      <ellipse cx="50" cy="44" rx="19" ry="21" fill={look.skin} />
      {/* hair */}
      {look.hairStyle === 'bob' && (
        <path d="M29 46 q-2-26 21-26 t21 26 q-4-12 -21-12 t-21 12 z M29 44 q-3 14 2 20 q-6-10 -2-20 M71 44 q3 14 -2 20 q6-10 2-20" fill={look.hair} />
      )}
      {look.hairStyle === 'grey' && <path d="M31 40 q1-22 19-22 t19 22 q-6-11 -19-11 t-19 11 z" fill={look.hair} />}
      {look.hairStyle === 'bun' && (
        <>
          <circle cx="50" cy="18" r="7" fill={look.hair} />
          <path d="M31 42 q1-23 19-23 t19 23 q-6-12 -19-12 t-19 12 z" fill={look.hair} />
        </>
      )}
      {look.hairStyle === 'wrap' && (
        <path d="M28 46 q0-27 22-27 t22 27 q-2-8 -6-11 q-16 6 -32 0 q-4 3 -6 11 z" fill={look.hair} />
      )}
      {look.hairStyle === 'crop' && <path d="M31 41 q2-21 19-21 t19 21 q-7-9 -19-9 t-19 9 z" fill={look.hair} />}
      {look.hairStyle === 'short' && <path d="M31 42 q2-22 19-22 t19 22 q-7-10 -19-10 t-19 10 z" fill={look.hair} />}
      {/* features */}
      <circle cx="43" cy="44" r="1.9" fill="#3A322C" />
      <circle cx="57" cy="44" r="1.9" fill="#3A322C" />
      <path d="M40 38 q3-2 6-0.5" stroke="#3A322C" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M54 37.5 q3-1.5 6 0.5" stroke="#3A322C" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M46 54 q4 3 8 0" stroke="#8A5A48" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </svg>
  )
}
