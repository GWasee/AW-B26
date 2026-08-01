import { useEffect, useRef, useState, type CSSProperties } from 'react'

export type GuestbookEntry = {
  id: string
  name: string
  message: string
  created_at: string
}

// Ashra's birthday moment — edit this date to point at the real celebration.
const BIRTHDAY = new Date('2026-08-01T18:00:00')



// Photos revealed when each balloon is popped (photos of "us").
const BALLOON_PHOTOS = [
  '/images/gallery/gallery-4.jpeg',
  '/images/gallery/gallery-5.jpeg',
  '/images/gallery/gallery-6.jpeg',
  '/images/gallery/gallery-11.jpeg',
  '/images/gallery/gallery-21.gif',
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
  { src: '/images/gallery/gallery-8.jpeg', caption: '' },
  { src: '/images/gallery/gallery-11.jpeg', caption: '' },
  { src: '/images/gallery/gallery-19.jpeg', caption: '' },
  { src: '/images/gallery/gallery-12.jpeg', caption: '' },
  { src: '/images/gallery/gallery-15.jpeg', caption: '' },
  { src: '/images/gallery/gallery-16.jpeg', caption: '' },
  { src: '/images/gallery/gallery-14.jpeg', caption: 'Wearing her favorite Tshirt' },
  { src: '/images/gallery/gallery-5.jpeg', caption: 'Buying Cake for Waqar but found the real Cake sitting sexy' },
  { src: '/images/gallery/gallery-9.jpeg', caption: '' },
  { src: '/images/gallery/gallery-4.jpeg', caption: 'Krishibari Trip Best Couple Winner' },
  { src: '/images/gallery/gallery-20.jpeg', caption: '' },
  { src: '/images/gallery/gallery-1.jpeg', caption: 'WOK ON date for spicyy dumplings' },

  { src: '/images/gallery/gallery-3.jpeg', caption: 'Cha Time or Cuddle time?' },
  { src: '/images/gallery/gallery-6.jpeg', caption: '31st night at Neela Market, Hash er mangsho by the lake (we went to another resturant that night)' },
  { src: '/images/gallery/gallery-18.jpeg', caption: 'Us being hot at the other resturant' },
  { src: '/images/gallery/gallery-2.jpeg', caption: 'Mouccha Milon time at banani bridge otw to print your docs ' },
  { src: '/images/gallery/gallery-7.jpeg', caption: 'Why are we so cute' },
  { src: '/images/gallery/gallery-13.jpeg', caption: 'eida toh bhule gesi koi' },
  { src: '/images/gallery/gallery-17.jpeg', caption: 'cutiepie' },
  { src: '/images/gallery/gallery-10.jpeg', caption: '' },
  { src: '/images/gallery/gallery-22.jpeg', caption: 'Cristiano Who?' },
  { src: '/images/gallery/gallery-23.jpeg', caption: 'Lojju' },
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

  const skipToExperience = () => {
    setRevealed(true)
    setBloomDone(true)
  }

  return (
    <>
      <Intro
        popped={popped}
        onPop={popBalloon}
        hidden={revealed && bloomDone}
        balloons={balloons}
        revealedPhotos={revealedPhotos}
        onSkip={skipToExperience}
      />
      {revealed && !bloomDone && <FlowerBloom onDone={() => setBloomDone(true)} />}
      <div className={`experience ${revealed && bloomDone ? 'shown' : ''}`} ref={ref}>
        <Hero t={t} />
        <Gallery />
        {/* <Video /> */}
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
  onSkip,
}: {
  popped: number
  onPop: (i: number) => void
  hidden: boolean
  balloons: BalloonState[]
  revealedPhotos: { index: number; x: number; y: number }[]
  onSkip: () => void
}) {
  const poppedCount = (popped.toString(2).match(/1/g) || []).length
  const allPopped = poppedCount === 5


  const [noPos, setNoPos] = useState({ x: 55, y: 70 })

  const moveNoButton = () => {
    setNoPos({
      x: 15 + Math.random() * 70,
      y: 20 + Math.random() * 60,
    })
  }

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
        <div className="intro-eyebrow">A little surprise for Wasee's bbg</div>
        <h1>For Ashra</h1>
        <p>Pop every balloon to unlock your birthday surprise.</p>
      </div>
      <div className="tap-hint">
        {poppedCount === 0 ? 'Tap the balloons to begin and press NEXT :P -->' : `${poppedCount} of 5 popped`}
      </div>
      {allPopped && (
        <>
          <button
            className="skip-btn"
            style={{
              top: "70%",
              left: "40%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={onSkip}
          >
            YES ❤️
          </button>

          <button
            className="skip-btn"
            style={{
              top: `${noPos.y}%`,
              left: `${noPos.x}%`,
              transform: "translate(-50%, -50%)",
            }}
            onMouseEnter={moveNoButton}
            onClick={moveNoButton}
          >
            NO 😤
          </button>
        </>
      )}
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
      <p className="hero-sub">Some gifts come wrapped. This one is written in code. Today is all about you. This little corner of the internet exists for one reason—to celebrate the amazing person you are.
        Built with love, made just for you. ❤️</p>
      <div className={`countdown ${t.done ? 'celebrating' : ''}`}>
        <Unit n={t.days} label="Days" />
        <Unit n={t.hours} label="Hours" />
        <Unit n={t.minutes} label="Minutes" />
        <Unit n={t.seconds} label="Seconds" />
      </div>
      {t.done && <p className="hero-sub" style={{ marginTop: 8 }}>It's time. Happy birthday, Ashra you beauty</p>}
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
          <p>A few frames that might make you feel 10 e 10. Hover to see them come alive.</p>
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

// function Video() {
//   return (
//     <section className="section reveal">
//       <div className="container">
//         <div className="section-head">
//           <h2>A Message For You</h2>
//           <p>Press play when you're ready.</p>
//         </div>
//         <div className="video-wrap">
//           <video controls playsInline poster="https://images.pexels.com/photos/15211704/pexels-photo-15211704.jpeg?auto=compress&cs=tinysrgb&h=650&w=940">
//             <source src="https://cdn.coverr.co/videos/coverr-a-birthday-cake-with-candles-2633/1080p.mp4" type="video/mp4" />
//             Your browser does not support video playback.
//           </video>
//         </div>
//       </div>
//     </section>
//   )
// }

function Guestbook() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('birthday_guestbook')
      if (stored) {
        setEntries(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Error loading guestbook wishes:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const newEntry: GuestbookEntry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        message: message.trim(),
        created_at: new Date().toISOString()
      }

      const updatedEntries = [newEntry, ...entries]
      localStorage.setItem('birthday_guestbook', JSON.stringify(updatedEntries))
      setEntries(updatedEntries)
      setName('')
      setMessage('')
    } catch (e) {
      setError('Could not save your wish locally.')
    } finally {
      setSubmitting(false)
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
      <img
        src="/images/gallery/gallery-21.gif"
        alt="Signature"
        style={{
          width: "10%",
          height: "auto",
          display: "block",
          margin: "50px auto",
        }}
      />
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