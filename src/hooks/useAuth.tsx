import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ExperienceLevel, LearningGoal, User } from '@/types'
import { authService, type RegisterInput } from '@/services/authService'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  completeOnboarding: (goals: LearningGoal[], experience: ExperienceLevel) => Promise<User>
  updateProfile: (patch: Partial<User>) => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    authService
      .currentUser()
      .then((result) => {
        if (active) setUser(result)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn(email, password)
    setUser(result)
    return result
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const result = await authService.signInWithGoogle()
    setUser(result)
    return result
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authService.register(input)
    setUser(result)
    return result
  }, [])

  const completeOnboarding = useCallback(async (goals: LearningGoal[], experience: ExperienceLevel) => {
    const result = await authService.completeOnboarding({ goals, experience })
    setUser(result)
    return result
  }, [])

  const updateProfile = useCallback(async (patch: Partial<User>) => {
    const result = await authService.updateProfile(patch)
    setUser(result)
    return result
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signInWithGoogle, register, completeOnboarding, updateProfile, signOut }),
    [user, loading, signIn, signInWithGoogle, register, completeOnboarding, updateProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
