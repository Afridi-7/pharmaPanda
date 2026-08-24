import type { ExperienceLevel, LearningGoal, User, YearOfStudy } from '@/types'
import { ApiError } from './api'
import { clearToken, getToken, http, setToken } from './http'

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
  university: string
  year: YearOfStudy
}

export interface OnboardingInput {
  goals: LearningGoal[]
  experience: ExperienceLevel
}

/**
 * Real authentication against the FastAPI backend.
 *
 * Users live in PostgreSQL; passwords are Argon2id-hashed server-side and never
 * touch this layer beyond being posted once over the wire. The backend is the
 * source of truth for the session.
 */

/** The backend's camelCase user payload — mirrors the React `User` type. */
interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export const authService = {
  /**
   * Restores the session on app start.
   *
   * Returns null when there is no token, or when the backend rejects it — a
   * stale token is cleared by the HTTP layer rather than left to fail later.
   */
  async currentUser(): Promise<User | null> {
    if (!getToken()) return null
    try {
      return await http<User>('/auth/me')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      // A backend outage should not masquerade as "signed out" forever, but the
      // app still needs a usable answer at boot.
      return null
    }
  },

  async signIn(email: string, password: string): Promise<User> {
    const result = await http<AuthResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    })
    setToken(result.accessToken)
    return result.user
  },

  /**
   * Google sign-in is not implemented yet.
   *
   * Previously this silently authenticated a fake demo user. It now fails
   * honestly — an unimplemented provider must never mint a session.
   */
  async signInWithGoogle(): Promise<User> {
    throw new ApiError(
      'google oauth not implemented',
      501,
      'Google sign-in isn’t enabled yet. Please use your email address and password.',
    )
  },

  async register(input: RegisterInput): Promise<User> {
    const result = await http<AuthResponse>('/auth/register', {
      method: 'POST',
      auth: false,
      body: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        password: input.password,
        university: input.university,
        year: input.year,
      },
    })
    setToken(result.accessToken)
    return result.user
  },

  async completeOnboarding(input: OnboardingInput): Promise<User> {
    return http<User>('/auth/onboarding', {
      method: 'POST',
      body: { goals: input.goals, experience: input.experience },
    })
  },

  /**
   * Patches the profile.
   *
   * Only the fields the backend allows are forwarded; id, email, onboarded and
   * timestamps are rejected server-side, so they are not sent at all.
   */
  async updateProfile(patch: Partial<User>): Promise<User> {
    const body: Record<string, unknown> = {}
    if (patch.firstName !== undefined) body.firstName = patch.firstName
    if (patch.lastName !== undefined) body.lastName = patch.lastName
    if (patch.university !== undefined) body.university = patch.university
    if (patch.year !== undefined) body.year = patch.year
    if (patch.avatarSeed !== undefined) body.avatarSeed = patch.avatarSeed
    if (patch.learningGoals !== undefined) body.learningGoals = patch.learningGoals
    if (patch.experience !== undefined) body.experience = patch.experience

    return http<User>('/auth/profile', { method: 'PATCH', body })
  },

  /**
   * Signs out.
   *
   * Access tokens are stateless, so the authoritative step is discarding the
   * token locally. The backend call is best-effort: it gives the server an
   * audit point and a place to hang revocation later, but a failure must not
   * strand the user in a signed-in state.
   */
  async signOut(): Promise<void> {
    try {
      await http<void>('/auth/logout', { method: 'POST' })
    } catch {
      // Ignored on purpose — see above.
    } finally {
      clearToken()
    }
  },

  /**
   * Clears local device preferences.
   *
   * Consultation progress lives in PostgreSQL against the account and is not
   * affected — deleting real results would need its own explicit endpoint.
   */
  async resetProgress(): Promise<void> {
    try {
      window.localStorage.removeItem('pharmapanda.settings.v1')
    } catch {
      // Nothing to clear.
    }
  },
}
