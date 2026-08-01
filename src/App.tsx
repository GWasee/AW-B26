import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { supabase, type GuestbookEntry } from './lib/supabase'

// Ashra's birthday moment — edit this date to point at the real celebration.
const BIRTHDAY = new Date('2026-08-15T18:00:00')

// Photos revealed when each balloon is popped (photos of "us").
const BALLOON_PHOTOS = [
  'https://images.pexels.com/photos/8628344/pexels-photo-8628344.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/32439850/pexels-photo-32439850.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/30151352/pexels-photo-30151352.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7741629/pexels-photo-7741629.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/30740900/pexels-photo-30740900.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
]

const BALLOON_COLORS = [
  'radial-gradient(circle at 30% 25%, #ff8fb3, #e0427a)',
  'radial-gradient(circle at 30% 25%, #ffe08a, #f0b429)',
  'radial-gradient(circle at 30% 25%, #8fd9ff, #3aa6e0)',
  'radial-gradient(circle at 30% 25%, #c4a8ff, #8a5cf0)',
  'radial-gradient(circle at 30% 25%, #a8f0c4, #4dbe86)',
]

const FLOWER_IMAGES = [
  'https://images.pexels.com/photos/189379/pexels-photo-189379.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/33106607/pexels-photo-33106607.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/33774304/pexels-photo-33774304.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/17989077/pexels-photo-17989077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/33215685/pexels-photo-33215685.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/4986424/pexels-photo-4986424.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/14582219/pexels-photo-14582219.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/11693038/pexels-photo-11693038.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
]

const GALLERY = [
  { src: 'https://images.pexels.com/photos/36211802/pexels-photo-36211802.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: 'Make a wish' },
  { src: 'https://images.pexels.com/photos/30682919/pexels-photo-30682919.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: 'With the people you love' },
  { src: 'https://images.pexels.com/photos/15211704/pexels-photo-15211704.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: 'Light up the room' },
  { src: 'https://images.pexels.com/photos/5970895/pexels-photo-5970895.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: 'Confetti season' },
  { src: 'https://images.pexels.com/photos/20346916/pexels-photo-20346916.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: 'Another trip around the sun' },
  { src: 'https://images.pexels.com/photos/33038785/pexels-photo-33038785.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: 'Cheers to you' },
]

type BalloonState = {
  x: number
  y: number
  vx: number
  vy: number
  drift: number
  phase: number
}

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      done: false,
    }
  }
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const els = ref.current?.querySelectorAll('.reveal')
    if (!els) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return ref
}

export default function App() {
  const [revealed, setRevealed] = useState(false)
  const [bloomDone, setBloomDone] = useState(false)
  const [popped, setPopped] = useState(0)
  const [revealedPhotos, setRevealedPhotos] = useState<{ index: number; x: number; y: number }[]>([])
  const [balloons, setBalloons] = useState<BalloonState[]>(() =>
    Array.from({ length: 5 }, () => ({
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 60,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.012,
      drift: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
    })),
  )
  const [, forceTick] = useState(0)
  const t = useCountdown(BIRTHDAY)
  const ref = useReveal()

  // animate balloons with rAF
  useEffect(() => {
    if (revealed) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(now - last, 50)
      last = now
      setBalloons((prev) => {
        const next = prev.map((b) => {
          let { x, y, vx, vy, drift, phase } = b
          drift += 0.0003 * dt
          phase += 0.0008 * dt
          vx += Math.sin(drift) * 0.0003 * dt
          vy += Math.cos(drift * 1.3) * 0.0002 * dt
          // gentle damping
          vx *= 0.99
          vy *= 0.99
          x += vx * dt
          y += vy * dt + Math.sin(phase) * 0.0015 * dt
          // bounce off edges
          if (x < 2) { x = 2; vx = Math.abs(vx) }
          if (x > 92) { x = 92; vx = -Math.abs(vx) }
          if (y < 5) { y = 5; vy = Math.abs(vy) }
          if (y > 80) { y = 80; vy = -Math.abs(vy) }
          return { x, y, vx, vy, drift, phase }
        })
        // pairwise collision: push overlapping balloons apart
        const minDist = 12 // approx balloon radius in % units
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i]
            const b = next[j]
            const dx = b.x - a.x
            const dy = b.y - a.y
            const dist = Math.hypot(dx, dy) || 0.001
            if (dist < minDist) {
              const overlap = (minDist - dist) / 2
              const nx = dx / dist
              const ny = dy / dist
              a.x -= nx * overlap
              a.y -= ny * overlap
              b.x += nx * overlap
              b.y += ny * overlap
              // exchange a bit of velocity (bounce)
              const av = a.vx * nx + a.vy * ny
              const bv = b.vx * nx + b.vy * ny
              const push = (bv - av) * 0.5
              a.vx += nx * push
              a.vy += ny * push
              b.vx -= nx * push
              b.vy -= ny * push
            }
          }
        }
        return next
      })
      forceTick((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [revealed])

  const popBalloon = (i: number) => {
    if (popped & (1 << i)) return
    const b = balloons[i]
    setRevealedPhotos((prev) => [...prev, { index: i, x: b.x, y: b.y }])
    const next = popped | (1 << i)
    setPopped(next)
    if (next === 0b11111) {
      setTimeout(() => setRevealed(true), 1200)
    }
  }

  return (
    <>
      <Intro
        popped={popped}
        onPop={popBalloon}
        hidden={revealed && bloomDone}
        balloons={balloons}
        revealedPhotos={revealedPhotos}
      />
      {revealed && !bloomDone && <FlowerBloom onDone={() => setBloomDone(true)} />}
      <div className={`experience ${revealed && bloomDone ? 'shown' : ''}`} ref={ref}>
        <Hero t={t} />
        <Gallery />
        <Video />
        <Guestbook />
        <Footer />
      </div>
    </>
  )
}

function Intro({
  popped,
  onPop,
  hidden,
  balloons,
  revealedPhotos,
}: {
  popped: number
  onPop: (i: number) => void
  hidden: boolean
  balloons: BalloonState[]
  revealedPhotos: { index: number; x: number; y: number }[]
}) {
  const poppedCount = (popped.toString(2).match(/1/g) || []).length
  return (
    <div className={`intro ${hidden ? 'hidden' : ''}`}>
      <div className="balloon-field">
        {balloons.map((b, i) => {
          const isPopped = !!(popped & (1 << i))
          const style: CSSProperties = {
            left: `${b.x}%`,
            top: `${b.y}%`,
            background: BALLOON_COLORS[i],
          }
          return (
            <button
              key={i}
              className={`balloon ${isPopped ? 'popped' : ''}`}
              style={style}
              aria-label={`Balloon ${i + 1}`}
              onClick={() => onPop(i)}
            />
          )
        })}
        {revealedPhotos.map((p) => (
          <div
            key={p.index}
            className="balloon-photo"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <img src={BALLOON_PHOTOS[p.index]} alt="A memory" loading="lazy" />
          </div>
        ))}
      </div>
      <div className="intro-text">
        <div className="intro-eyebrow">A little surprise</div>
        <h1>For Ashra</h1>
        <p>Tap every balloon to unlock your birthday surprise.</p>
      </div>
      <div className="tap-hint">
        {poppedCount === 0 ? 'Tap the balloons to begin' : `${poppedCount} of 5 popped`}
      </div>
    </div>
  )
}

function FlowerBloom({ onDone }: { onDone: () => void }) {
  // generate flowers at random positions
  const flowers = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      src: FLOWER_IMAGES[i % FLOWER_IMAGES.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 120 + Math.random() * 180,
      delay: Math.random() * 0.5,
    })),
  )
  useEffect(() => {
    const id = setTimeout(onDone, 2200)
    return () => clearTimeout(id)
  }, [onDone])
  return (
    <div className="flower-bloom">
      {flowers.current.map((f, i) => (
        <img
          key={i}
          className="flower"
          src={f.src}
          alt=""
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

function Hero({ t }: { t: ReturnType<typeof useCountdown> }) {
  return (
    <header className="hero">
      <div className="hero-eyebrow">Happy Birthday</div>
      <h1>Ashra</h1>
      <p className="hero-sub">Today is all about you. Here's a little corner of the internet built with love, just to celebrate you.</p>
      <div className={`countdown ${t.done ? 'celebrating' : ''}`}>
        <Unit n={t.days} label="Days" />
        <Unit n={t.hours} label="Hours" />
        <Unit n={t.minutes} label="Minutes" />
        <Unit n={t.seconds} label="Seconds" />
      </div>
      {t.done && <p className="hero-sub" style={{ marginTop: 8 }}>It's time. Happy birthday, Ashra!</p>}
    </header>
  )
}

function Unit({ n, label }: { n: number; label: string }) {
  return (
    <div className="count-unit">
      <div className="count-num">{String(n).padStart(2, '0')}</div>
      <div className="count-label">{label}</div>
    </div>
  )
}

function Gallery() {
  return (
    <section className="section reveal">
      <div className="container">
        <div className="section-head">
          <h2>Moments</h2>
          <p>A few frames that feel like a birthday. Hover to see them come alive.</p>
        </div>
        <div className="gallery">
          {GALLERY.map((g, i) => (
            <div className="gallery-item" key={i}>
              <img src={g.src} alt={g.caption} loading="lazy" />
              <div className="gallery-caption">{g.caption}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Video() {
  return (
    <section className="section reveal">
      <div className="container">
        <div className="section-head">
          <h2>A Message For You</h2>
          <p>Press play when you're ready.</p>
        </div>
        <div className="video-wrap">
          <video controls playsInline poster="https://images.pexels.com/photos/15211704/pexels-photo-15211704.jpeg?auto=compress&cs=tinysrgb&h=650&w=940">
            <source src="https://cdn.coverr.co/videos/coverr-a-birthday-cake-with-candles-2633/1080p.mp4" type="video/mp4" />
            Your browser does not support video playback.
          </video>
        </div>
      </div>
    </section>
  )
}

function Guestbook() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('birthday_guestbook')
      .select('id, name, message, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setEntries(data as GuestbookEntry[])
        setLoading(false)
      })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return
    setSubmitting(true)
    setError('')
    const { data, error } = await supabase
      .from('birthday_guestbook')
      .insert({ name: name.trim(), message: message.trim() })
      .select('id, name, message, created_at')
      .single()
    setSubmitting(false)
    if (error) {
      setError('Could not add your wish. Please try again.')
      return
    }
    if (data) {
      setEntries((prev) => [data as GuestbookEntry, ...prev])
      setName('')
      setMessage('')
    }
  }

  return (
    <section className="section reveal">
      <div className="container">
        <div className="section-head">
          <h2>Leave A Wish</h2>
          <p>Add a birthday note for Ashra. It'll show up on the wall below.</p>
        </div>
        <form className="guestbook-form" onSubmit={submit}>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
          <textarea
            placeholder="Write your birthday wish..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={400}
            required
          />
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add your wish'}
          </button>
        </form>

        {loading ? (
          <div className="empty-state">Loading the wishes...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">Be the first to leave a wish for Ashra.</div>
        ) : (
          <div className="wishes">
            {entries.map((w) => (
              <div className="wish" key={w.id}>
                <div className="wish-name">{w.name}</div>
                <div className="wish-msg">{w.message}</div>
                <div className="wish-time">{new Date(w.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      Made with <span className="heart">love</span> for Ashra. Have the happiest of birthdays.
    </footer>
  )
}
