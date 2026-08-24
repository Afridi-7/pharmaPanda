import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Stable-enough id generator for mock data created in the browser. */
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatMinutes(seconds: number) {
  const m = Math.max(1, Math.round(seconds / 60))
  return `${m} min`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function relativeDay(iso: string) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.round(days / 7)} weeks ago`
  return formatDate(iso)
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

export function greetingForNow(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

/**
 * Score bands drive tone, never colour alone — each band also carries a label so
 * clinical status is communicated textually as well.
 */
export function scoreBand(score: number): { label: string; tone: 'strong' | 'solid' | 'developing' | 'attention' } {
  if (score >= 85) return { label: 'Strong', tone: 'strong' }
  if (score >= 70) return { label: 'Solid', tone: 'solid' }
  if (score >= 55) return { label: 'Developing', tone: 'developing' }
  return { label: 'Needs work', tone: 'attention' }
}

export function normalise(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Word-boundary aware keyword match used by the mock patient engine. */
export function matchesAny(text: string, keywords: string[]) {
  const haystack = ` ${normalise(text)} `
  return keywords.some((k) => haystack.includes(` ${normalise(k)} `) || haystack.includes(normalise(k)))
}

export function pick<T>(items: T[], seed: number) {
  if (items.length === 0) throw new Error('pick() needs at least one item')
  return items[Math.abs(seed) % items.length]
}
