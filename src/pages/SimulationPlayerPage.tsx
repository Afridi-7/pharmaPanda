import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClipboardList, ListChecks, MessageSquare, NotebookPen } from 'lucide-react'
import type {
  Patient,
  PatientFact,
  RecommendationOption,
  ReferralOption,
  Scenario,
  ScenarioAttempt,
} from '@/types'
import { ConversationThread, PatientHeader } from '@/components/simulation/ConversationThread'
import { ObjectivesPanel, PatientInfoPanel } from '@/components/simulation/PatientInfoPanel'
import { FinishModal, NotesPanel, EvaluationLoading } from '@/components/simulation/NotesPanel'
import { SimulationTopBar } from '@/components/simulation/SimulationTopBar'
import {
  ActionBar,
  AskBar,
  CounselPanel,
  RecommendPanel,
  ReferPanel,
  type ConsultationMode,
} from '@/components/simulation/ActionPanels'
import { ErrorState, LoadingState } from '@/components/common/States'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { consultationObjectives } from '@/lib/objectives'
import { attemptService, evaluationService, scenarioService } from '@/services'
import { ApiError } from '@/services/api'
import { cn } from '@/lib/utils'

/** How often the elapsed timer is written back through the service. */
const TICK_PERSIST_SECONDS = 15
/** Idle time before notes are autosaved. */
const NOTES_DEBOUNCE_MS = 700

type WorkspaceTab = 'conversation' | 'patient' | 'objectives' | 'notes'

interface Loaded {
  attempt: ScenarioAttempt
  scenario: Scenario
  patient: Patient
}

/**
 * The consultation workspace.
 *
 * All clinical behaviour — what the patient says, which facts a question
 * unlocks, which objectives are met — belongs to the patient engine behind
 * `attemptService`. This page owns presentation and interaction only: it sends
 * the student's action to the service and renders the `ScenarioAttempt` that
 * comes back. There is deliberately no scenario-specific logic here.
 */
export function SimulationPlayerPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [mode, setMode] = useState<ConsultationMode>('ask')
  const [tab, setTab] = useState<WorkspaceTab>('conversation')
  const [thinking, setThinking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [justRevealed, setJustRevealed] = useState<string[]>([])

  const [seconds, setSeconds] = useState(0)
  const [finishOpen, setFinishOpen] = useState(false)
  const [evaluating, setEvaluating] = useState(false)

  const [notes, setNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(true)

  // --- Load ---------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const attempt = await attemptService.get(id)
      const scenario = await scenarioService.get(attempt.scenarioId)
      // Fetched per attempt: the server returns only the facts this
      // consultation has uncovered, so hidden detail never reaches the client.
      const patient = await scenarioService.getPatientForAttempt(attempt.id)
      setLoaded({ attempt, scenario, patient })
      setNotes(attempt.notes)
      setSeconds(attempt.durationSeconds)
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.userMessage : 'We couldn’t open this consultation.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const attempt = loaded?.attempt ?? null
  const status = attempt?.status
  const locked = status !== undefined && status !== 'in-progress'
  const active = status === 'in-progress'

  // An already-evaluated attempt has a report waiting; send the student there
  // rather than showing them a consultation they cannot change.
  useEffect(() => {
    if (status === 'evaluated' && !evaluating) {
      navigate(`/results/${id}`, { replace: true })
    }
  }, [status, evaluating, id, navigate])

  const secondsRef = useRef(seconds)
  secondsRef.current = seconds

  // --- Timer --------------------------------------------------------------
  // Runs only while the consultation is live, and only persists periodically so
  // the store is not rewritten every second.
  useEffect(() => {
    if (!active) return
    const handle = window.setInterval(() => {
      setSeconds((previous) => {
        const next = previous + 1
        if (next % TICK_PERSIST_SECONDS === 0) void attemptService.tick(id, next)
        return next
      })
    }, 1000)
    return () => window.clearInterval(handle)
  }, [active, id])

  // Leaving mid-consultation keeps the attempt in-progress — exiting is not
  // abandoning — but the elapsed time should survive the exit.
  useEffect(() => {
    if (!active) return
    return () => {
      void attemptService.tick(id, secondsRef.current)
    }
  }, [active, id])

  // --- Notes autosave -----------------------------------------------------
  const onNotesChange = useCallback((next: string) => {
    setNotes(next)
    setNotesSaved(false)
  }, [])

  useEffect(() => {
    if (!active || notesSaved) return
    const handle = window.setTimeout(() => {
      void attemptService
        .saveNotes(id, notes)
        .then((updated) => {
          setLoaded((prev) => (prev ? { ...prev, attempt: updated } : prev))
          setNotesSaved(true)
        })
        .catch(() => {
          /* Autosave is best-effort; the text stays in the field either way. */
        })
    }, NOTES_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [notes, notesSaved, active, id])

  // --- Actions ------------------------------------------------------------
  /**
   * Fold a service result back into page state.
   *
   * Newly revealed facts are merged into the loaded patient: the server only
   * ever sends facts this attempt has uncovered, so the patient loaded at mount
   * does not yet contain them and the panel would otherwise stay empty.
   */
  const applyResult = useCallback(
    (updated: ScenarioAttempt, revealed: PatientFact[]) => {
      setLoaded((prev) => {
        if (!prev) return prev
        const known = new Set(prev.patient.facts.map((fact) => fact.id))
        const fresh = revealed.filter((fact) => !known.has(fact.id))
        return {
          ...prev,
          attempt: updated,
          patient: fresh.length
            ? { ...prev.patient, facts: [...prev.patient.facts, ...fresh] }
            : prev.patient,
        }
      })
      setJustRevealed(revealed.map((fact) => fact.id))
    },
    [],
  )

  const runAction = useCallback(
    async (fn: () => Promise<{ attempt: ScenarioAttempt; revealed: PatientFact[] }>) => {
      setBusy(true)
      setActionError(null)
      try {
        const result = await fn()
        applyResult(result.attempt, result.revealed)
      } catch (error) {
        setActionError(
          error instanceof ApiError
            ? error.userMessage
            : 'We couldn’t record that just now. Please try again.',
        )
      } finally {
        setBusy(false)
      }
    },
    [applyResult],
  )

  const onAsk = useCallback(
    async (question: string) => {
      setThinking(true)
      setActionError(null)
      try {
        const result = await attemptService.ask(id, question)
        applyResult(result.attempt, result.revealed)
      } catch (error) {
        setActionError(
          error instanceof ApiError
            ? error.userMessage
            : 'Your patient didn’t catch that. Please try again.',
        )
      } finally {
        setThinking(false)
      }
    },
    [id, applyResult],
  )

  const onRecommend = useCallback(
    (choice: RecommendationOption, reasoning: string) =>
      runAction(() => attemptService.recommend(id, choice, reasoning)),
    [id, runAction],
  )

  const onCounsel = useCallback(
    (script: string) => runAction(() => attemptService.counsel(id, script)),
    [id, runAction],
  )

  const onRefer = useCallback(
    (choice: ReferralOption, reasoning: string) =>
      runAction(() => attemptService.refer(id, choice, reasoning)),
    [id, runAction],
  )

  // --- Finish -------------------------------------------------------------
  const confirmFinish = useCallback(async () => {
    setBusy(true)
    setActionError(null)
    try {
      // Flush any notes still sitting in the debounce window.
      if (!notesSaved) await attemptService.saveNotes(id, notes)
      const finished = await attemptService.finish(id, secondsRef.current)
      setLoaded((prev) => (prev ? { ...prev, attempt: finished } : prev))
      setFinishOpen(false)
      setEvaluating(true)
      await evaluationService.evaluate(id)
    } catch (error) {
      setEvaluating(false)
      setActionError(
        error instanceof ApiError
          ? error.userMessage
          : 'We couldn’t submit your consultation. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }, [id, notes, notesSaved])

  const onExit = useCallback(() => {
    // Exiting preserves the attempt — it stays in-progress and can be resumed.
    navigate(loaded ? `/simulations/${loaded.scenario.id}` : '/simulations')
  }, [navigate, loaded])

  // --- Derived ------------------------------------------------------------
  const objectivesMet = attempt?.objectivesMet ?? []
  const progress = (objectivesMet.length / consultationObjectives.length) * 100

  const outstanding = useMemo(
    () =>
      consultationObjectives
        .filter((objective) => !objectivesMet.includes(objective.id))
        .map((objective) => objective.label),
    [objectivesMet],
  )

  const done = {
    recommend: Boolean(attempt?.recommendation),
    counsel: Boolean(attempt?.counseling),
    refer: Boolean(attempt?.referral),
  }

  // --- Render -------------------------------------------------------------
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <LoadingState message="preparing" className="w-full max-w-sm" />
      </div>
    )
  }

  if (loadError || !loaded || !attempt) {
    return (
      <div className="mx-auto grid min-h-screen max-w-lg place-items-center px-4">
        <ErrorState
          message={loadError ?? undefined}
          onRetry={load}
          backTo={{ href: '/simulations', label: 'Back to Simulations' }}
        />
      </div>
    )
  }

  if (evaluating) {
    return (
      <EvaluationLoading
        stages={evaluationService.stages}
        onDone={() => navigate(`/results/${id}`, { replace: true })}
      />
    )
  }

  const { patient, scenario } = loaded

  const workspacePanels = (
    <>
      <PatientInfoPanel
        facts={patient.facts}
        revealedIds={attempt.revealedFactIds}
        justRevealed={justRevealed}
      />
      <ObjectivesPanel objectives={consultationObjectives} met={objectivesMet} />
      <NotesPanel value={notes} onChange={onNotesChange} collapsible={!isDesktop} />
    </>
  )

  const interactionArea = locked ? (
    <div className="border-t border-beige bg-cream-light px-4 py-4 sm:px-5" role="status">
      <p className="text-sm text-ink-muted">
        This consultation has been submitted and can no longer be changed.
      </p>
    </div>
  ) : (
    <>
      {mode === 'ask' && <AskBar onAsk={onAsk} busy={thinking || busy} />}
      {mode === 'recommend' && (
        <RecommendPanel onSubmit={onRecommend} busy={busy} current={attempt.recommendation} />
      )}
      {mode === 'counsel' && (
        <CounselPanel onSubmit={onCounsel} busy={busy} current={attempt.counseling} />
      )}
      {mode === 'refer' && (
        <ReferPanel onSubmit={onRefer} busy={busy} current={attempt.referral} />
      )}
    </>
  )

  const mobileTabs: { value: WorkspaceTab; label: string; icon: typeof MessageSquare }[] = [
    { value: 'conversation', label: 'Consultation', icon: MessageSquare },
    { value: 'patient', label: 'Patient', icon: ClipboardList },
    { value: 'objectives', label: 'Objectives', icon: ListChecks },
    { value: 'notes', label: 'Notes', icon: NotebookPen },
  ]

  return (
    /* Desktop pins the workspace to exactly one viewport so nothing scrolls
       off the bottom; mobile keeps natural flow so the on-screen keyboard can
       push content instead of fighting a fixed height. dvh accounts for mobile
       browser chrome that vh gets wrong. */
    <div className="flex min-h-[100dvh] flex-col bg-cream lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden">
      <SimulationTopBar
        title={scenario.title}
        subtitle={`${patient.name} · ${scenario.setting}`}
        seconds={seconds}
        progress={progress}
        progressLabel={`${objectivesMet.length} of ${consultationObjectives.length} objectives`}
        onExit={onExit}
        exitLabel="Exit"
        softLimitSeconds={scenario.durationMinutes[1] * 60}
      />

      {/* Mobile: the consultation stays primary; the workspace is one tap away. */}
      {!isDesktop && (
        <nav aria-label="Consultation sections" className="border-b border-beige bg-cream-light">
          <ul className="flex">
            {mobileTabs.map((item) => {
              const activeTab = tab === item.value
              return (
                <li key={item.value} className="flex-1">
                  <button
                    type="button"
                    onClick={() => setTab(item.value)}
                    aria-current={activeTab ? 'page' : undefined}
                    className={cn(
                      'flex w-full flex-col items-center gap-1 border-b-2 px-1 py-2 text-[11px] font-medium transition-colors',
                      activeTab
                        ? 'border-forest text-forest'
                        : 'border-transparent text-ink-muted hover:text-forest',
                    )}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.9} />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      )}

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-0 py-0 lg:min-h-0 lg:flex-row lg:px-6 lg:py-4">
        {/* Patient consultation — 65% on desktop. */}
        <section
          aria-label="Patient consultation"
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden border-beige bg-cream-light lg:basis-[65%] lg:rounded-2xl lg:border lg:shadow-soft',
            !isDesktop && tab !== 'conversation' && 'hidden',
          )}
        >
          <PatientHeader patient={patient} />
          <ConversationThread
            patient={patient}
            messages={attempt.messages}
            thinking={thinking}
            className="min-h-[38vh] flex-1 lg:min-h-0"
          />

          {actionError && (
            <p role="alert" className="border-t border-beige bg-terracotta-100/60 px-4 py-2 text-xs font-medium text-terracotta-600 sm:px-5">
              {actionError}
            </p>
          )}

          {!locked && (
            <ActionBar mode={mode} onMode={setMode} onFinish={() => setFinishOpen(true)} done={done} />
          )}
          {interactionArea}
        </section>

        {/* Clinical workspace — 35% on desktop. */}
        <aside
          aria-label="Clinical workspace"
          className={cn(
            'flex min-w-0 flex-col gap-3 px-4 pb-6 lg:min-h-0 lg:basis-[35%] lg:overflow-y-auto lg:scroll-slim lg:px-0 lg:pb-0',
            !isDesktop && tab === 'conversation' && 'hidden',
          )}
        >
          {isDesktop ? (
            workspacePanels
          ) : (
            <div className="pt-4">
              {tab === 'patient' && (
                <PatientInfoPanel
                  facts={patient.facts}
                  revealedIds={attempt.revealedFactIds}
                  justRevealed={justRevealed}
                />
              )}
              {tab === 'objectives' && (
                <ObjectivesPanel objectives={consultationObjectives} met={objectivesMet} />
              )}
              {tab === 'notes' && <NotesPanel value={notes} onChange={onNotesChange} />}
            </div>
          )}
        </aside>
      </div>

      <FinishModal
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        onConfirm={confirmFinish}
        busy={busy}
        outstanding={outstanding}
      />
    </div>
  )
}
