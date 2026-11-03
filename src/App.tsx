import { useEffect, useMemo, useState } from 'react'
import { BrandMark } from './components/BrandMark'
import { FullRoster } from './components/FullRoster'
import { MyWeek } from './components/MyWeek'
import { WeekBar } from './components/WeekBar'
import { loadRoster, type LoadedRoster } from './lib/api'
import { closestWeekIndex, peopleIn, todayIso } from './lib/roster'

type Tab = 'mine' | 'roster' | 'settings'

const PROFILE_KEY = 'onsen_roster_profile_v1'

function savedName() {
  try { return localStorage.getItem(PROFILE_KEY) ?? '' } catch { return '' }
}

function StatusPill({ mode }: { mode: LoadedRoster['mode'] }) {
  const labels = { live: 'Live', cache: 'Saved copy', demo: 'Demo' }
  return <span className={`status-pill ${mode}`}><i />{labels[mode]}</span>
}

export default function App() {
  const [loaded, setLoaded] = useState<LoadedRoster | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('mine')
  const [weekIndex, setWeekIndex] = useState(0)
  const [dayIndex, setDayIndex] = useState(0)
  const [half, setHalf] = useState<'am' | 'pm'>(() => new Date().getHours() < 14 ? 'am' : 'pm')
  const [selectedName, setSelectedName] = useState(savedName)
  const [nameQuery, setNameQuery] = useState('')

  const refresh = async () => {
    setLoading(true)
    const result = await loadRoster()
    setLoaded(result)
    setWeekIndex(closestWeekIndex(result.payload.weeks))
    const today = todayIso()
    const currentWeek = result.payload.weeks[closestWeekIndex(result.payload.weeks)]
    const todayIndex = currentWeek.days.findIndex((day) => day.date === today)
    if (todayIndex >= 0) setDayIndex(todayIndex)
    setLoading(false)
  }

  useEffect(() => { void refresh() }, [])
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  }, [])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [tab, weekIndex])

  const people = useMemo(() => loaded ? peopleIn(loaded.payload) : [], [loaded])
  const filteredPeople = people.filter((name) => name.toLocaleLowerCase().includes(nameQuery.toLocaleLowerCase()))

  const chooseName = (name: string) => {
    setSelectedName(name)
    localStorage.setItem(PROFILE_KEY, name)
    setNameQuery('')
    setTab('mine')
  }

  if (!loaded || loading) {
    return <main className="loading-screen"><BrandMark /><div className="loader" /><p>Loading the roster…</p></main>
  }

  const week = loaded.payload.weeks[weekIndex]
  if (!week) return <main className="loading-screen"><p>No roster weeks are available.</p></main>

  const openDay = (nextDay: number, nextHalf: 'am' | 'pm') => {
    setDayIndex(nextDay)
    setHalf(nextHalf)
    setTab('roster')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <BrandMark />
        <StatusPill mode={loaded.mode} />
      </header>

      <main className="content">
        {tab !== 'settings' && <WeekBar weeks={loaded.payload.weeks} index={weekIndex} onChange={setWeekIndex} />}

        {loaded.error && <div className="notice">Live data was unavailable. Showing {loaded.mode === 'cache' ? 'the last saved roster' : 'demo data'}.</div>}

        {tab === 'mine' && (
          <MyWeek
            week={week}
            selectedName={selectedName}
            onChooseName={() => setTab('settings')}
            onOpenDay={openDay}
          />
        )}

        {tab === 'roster' && (
          <FullRoster
            week={week}
            dayIndex={dayIndex}
            half={half}
            selectedName={selectedName}
            onDayChange={setDayIndex}
            onHalfChange={setHalf}
          />
        )}

        {tab === 'settings' && (
          <section className="settings-page">
            <span className="eyebrow">Settings</span>
            <h1>Make it yours</h1>

            <article className="settings-card">
              <label htmlFor="name-search">Your name</label>
              <p>{selectedName ? `Currently showing shifts for ${selectedName}.` : 'Choose your name to see your personal week.'}</p>
              <input
                id="name-search"
                type="search"
                value={nameQuery}
                onChange={(event) => setNameQuery(event.target.value)}
                placeholder="Search the team"
              />
              <div className="name-list">
                {filteredPeople.map((name) => (
                  <button className={name === selectedName ? 'selected' : ''} key={name} onClick={() => chooseName(name)}>
                    <span className="avatar">{name[0]}</span>
                    <strong>{name}</strong>
                    {name === selectedName && <small>Selected</small>}
                  </button>
                ))}
              </div>
            </article>

            <article className="settings-card data-card">
              <div><span>Data source</span><strong>{loaded.payload.source.name}</strong></div>
              <div><span>Last updated</span><strong>{new Date(loaded.payload.fetchedAt).toLocaleString('en-NZ')}</strong></div>
              <button className="secondary-button" onClick={() => void refresh()}>Sync roster now</button>
            </article>

            <article className="privacy-note">
              <strong>Built to be handed over.</strong>
              <p>The repository, hosting, and domain can all move to Onsen-owned accounts. The roster is read-only and currently uses the permanent public spreadsheet link.</p>
            </article>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>
          <span>⌂</span><small>My week</small>
        </button>
        <button className={tab === 'roster' ? 'active' : ''} onClick={() => setTab('roster')}>
          <span>▦</span><small>Roster</small>
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          <span>⚙</span><small>Settings</small>
        </button>
      </nav>
    </div>
  )
}
