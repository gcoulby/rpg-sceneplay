export interface ParsedHeading {
  preamble: string
  prefix: string
  location: string
  timeOfDay: string
  raw: string
}

const TIME_WORDS =
  'DAY|NIGHT|DAWN|DUSK|MORNING|AFTERNOON|EVENING|SUNSET|SUNRISE|LATER|CONTINUOUS|SAME TIME|MOMENTS LATER|SAME|MAGIC HOUR'
const PREFIX_RE = /(INT\.?\/?EXT\.?|EXT\.?\/?INT\.?|INT\.?|EXT\.?|I\/E\.?)\s+/i

function normalisePrefix(raw: string): string {
  let p = raw.toUpperCase()
  if (
    p === 'INT/EXT' ||
    p === 'INT/EXT.' ||
    p === 'EXT/INT' ||
    p === 'EXT/INT.' ||
    p === 'I/E' ||
    p === 'I/E.'
  )
    return 'INT./EXT.'
  if (!p.endsWith('.')) p += '.'
  return p
}

export function parseHeading(raw: string): ParsedHeading {
  let rest = raw.trim()
  let preamble = ''
  let prefix = ''
  let timeOfDay = ''

  const prefixMatch = rest.match(PREFIX_RE)
  if (prefixMatch && prefixMatch.index !== undefined) {
    preamble = rest.slice(0, prefixMatch.index)
    prefix = normalisePrefix(prefixMatch[1])
    rest = rest.slice(prefixMatch.index + prefixMatch[0].length)
  }

  const dashTime = rest.match(new RegExp(`\\s+-\\s+(${TIME_WORDS})\\.?$`, 'i'))
  if (dashTime) {
    timeOfDay = dashTime[1].toUpperCase()
    rest = rest.slice(0, -dashTime[0].length)
  } else {
    const dotTime = rest.match(new RegExp(`\\.\\s*(${TIME_WORDS})\\.?$`, 'i'))
    if (dotTime) {
      timeOfDay = dotTime[1].toUpperCase()
      rest = rest.slice(0, -dotTime[0].length)
    }
  }

  const location = rest.replace(/^[\s.]+|[\s.]+$/g, '')
  return { preamble, prefix, location, timeOfDay, raw }
}

export function getPageFillStyle(pages: number): {
  color: string
  opacity: number
} {
  if (pages <= 1) return { color: 'var(--fd-accent)', opacity: 0.6 }
  const t = Math.min((pages - 1) / 4, 1) // 0 at 1 page, 1 at 5+ pages
  const hue = Math.round(120 * (1 - t)) // green(120) → red(0)
  const sat = 65 + Math.round(t * 25) // 65% → 90%
  const lit = 50 - Math.round(t * 10) // 50% → 40%
  const opacity = 0.65 + t * 0.3 // 0.65 → 0.95
  return { color: `hsl(${hue}, ${sat}%, ${lit}%)`, opacity }
}

export function formatPageLength(pages: number): string {
  const n = Number(pages.toFixed(2))
  return `${n} ${n <= 1 ? 'page' : 'pages'}`
}

export interface ParsedHeading {
  preamble: string
  prefix: string
  location: string
  timeOfDay: string
  raw: string
}

export interface LocationGroup {
  name: string
  sceneIndices: number[]
  headings: string[]
  prefixes: string[]
  times: string[]
  preambles: string[]
}

export function groupByLocation(
  scenes: Array<{ heading: string }>,
): LocationGroup[] {
  const map = new Map<string, LocationGroup>()
  scenes.forEach((scene, index) => {
    const parsed = parseHeading(scene.heading)
    const key = parsed.location.toUpperCase()
    if (!key) return
    let group = map.get(key)
    if (!group) {
      group = {
        name: parsed.location,
        sceneIndices: [],
        headings: [],
        prefixes: [],
        times: [],
        preambles: [],
      }
      map.set(key, group)
    }
    group.sceneIndices.push(index)
    group.headings.push(scene.heading)
    group.prefixes.push(parsed.prefix)
    group.times.push(parsed.timeOfDay)
    group.preambles.push(parsed.preamble.replace(/[\s.]+$/, ''))
  })
  return Array.from(map.values())
}
