import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ClipboardCheck,
  Compass,
  Eye,
  MessageSquare,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { PatientAvatar } from '@/components/brand/PatientAvatar'
import { buttonVariants } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const steps = [
  {
    icon: Compass,
    title: 'Choose a case',
    body: 'Ten scenarios across pain, respiratory, GI, dermatology and drug interactions.',
  },
  {
    icon: MessageSquare,
    title: 'Take a history',
    body: 'The patient gives a presenting complaint. Everything else depends on what you ask.',
  },
  {
    icon: Search,
    title: 'Uncover what matters',
    body: 'Allergies, current medication and past conditions are hidden until a relevant question is asked.',
  },
  {
    icon: ClipboardCheck,
    title: 'Decide and justify',
    body: 'Recommend, counsel or refer, and record the reasoning behind the decision.',
  },
  {
    icon: Eye,
    title: 'Review the consultation',
    body: 'Scored across six competencies, with the specific findings you missed and why they mattered.',
  },
]

const features = [
  '10 clinical cases across pain, respiratory, GI, dermatology and interactions',
  'Patient information hidden until the relevant question is asked',
  'Assessment based on the consultation, not multiple choice',
  'Reasoning timeline showing where a decision was made and on what evidence',
  'Pharmacy calculations with worked solutions',
]

export function LandingPage() {
  return (
    <>
      <section className="paper-grain border-b border-beige">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Badge tone="sage">Clinical simulation for pharmacy students</Badge>
            <h1 className="mt-4 font-display text-[34px] leading-[1.1] text-forest sm:text-[46px]">
              Consultation practice with patients who hold things back.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">
              PharmaPanda simulates over-the-counter consultations. Patients disclose allergies, current
              medication and past conditions only when you ask, and each consultation is assessed on the
              history you took, not just the product you chose.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/register" className={buttonVariants({ size: 'lg' })}>
                Create an account
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link to="/login" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }))}>
                Sign in
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink-muted">
              Educational simulation. Nothing here is clinical advice.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-3xl border border-beige bg-cream-light p-4 shadow-lift">
              <div className="flex items-center gap-3 border-b border-beige pb-3">
                <PatientAvatar avatar="sarah" name="Iqra Muhammad" size={44} />
                <div>
                  <p className="font-display text-sm text-forest">Iqra Muhammad, 20</p>
                  <p className="text-[11px] text-ink-muted">Community Pharmacy · Headache</p>
                </div>
                <Badge tone="neutral" className="ml-auto">Example</Badge>
              </div>
              <div className="space-y-3 py-4">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-beige bg-cream px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
                  Hi. I’ve had a really bad headache since yesterday. Could you recommend something?
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-forest px-3.5 py-2.5 text-[13px] leading-relaxed text-cream-light">
                  Are you allergic to any medicines?
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-beige bg-cream px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
                  Yes — aspirin. My face swelled up when I was a teenager.
                </div>
              </div>
              <div className="rounded-2xl border border-terracotta/40 bg-terracotta-100/60 px-3.5 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-terracotta-600">
                  Discovered · Allergies
                </p>
                <p className="mt-1 text-[13px] text-ink">Aspirin — facial swelling and wheeze</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl text-forest">How a case works</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Each consultation follows the same five stages.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage-100 text-forest">
                <step.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <h3 className="mt-3.5 font-display text-[17px] text-forest">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="border-y border-beige bg-cream-light">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-2xl text-forest">What's included</h2>
            <ul className="mt-5 space-y-2.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-ink">
                  <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-moss" strokeWidth={1.9} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-beige bg-cream p-6">
            <h3 className="font-display text-lg text-forest">How consultations are assessed</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Six competencies are scored from what you actually did: the questions asked and in what order,
              which findings were uncovered before a decision was committed to, and whether the counselling
              covered dose, limits and safety-netting.
            </p>
            <Link to="/register" className={cn(buttonVariants({ variant: 'moss' }), 'mt-5')}>
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
