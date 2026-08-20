import './style.css'

const starterCode = `const length = 70;

for (let i = 0; i < 6; i++) {
  turtle.forward(length);
  turtle.right(60);
}`

interface TurtleState {
  x: number
  y: number
  angle: number
  pen: boolean
  color: string
  width: number
}

interface TurtlePathSegment {
  fromX: number
  fromY: number
  toX: number
  toY: number
  color: string
  width: number
}

interface TurtleApi {
  forward(distance: number): void
  backward(distance: number): void
  right(degrees: number): void
  left(degrees: number): void
  goto(x: number, y: number): void
  penUp(): void
  penDown(): void
  color(value: string): void
  width(value: number): void
  home(): void
  clear(): void
}

interface ForLoop {
  endIndex: number
  declaration: string
  condition: string
  update: string
  bodyStart: number
}

interface TraceState {
  code: string
  lines: string[]
  pointer: number
  scope: Record<string, unknown>
  logs: string[]
  running: boolean
  turtleState: TurtleState
  activeLoop: ForLoop | null
  turtlePath: TurtlePathSegment[]
}

const app = document.querySelector<HTMLElement>('#app')!
const state: TraceState = { code: starterCode, lines: [], pointer: 0, scope: {}, logs: [], running: false, turtleState: { x: 0, y: 0, angle: -90, pen: true, color: '#e56d52', width: 3 }, activeLoop: null, turtlePath: [] }

app.innerHTML = `
  <header class="topbar"><div class="brand"><span class="brand-mark">✦</span><span>TRACE</span><small>JS playground</small></div><div class="top-actions"><span class="status"><i></i> Browser runtime</span><button class="icon-button" id="reset" title="Reset trace">↺</button></div></header>
  <main><section class="intro"><div><p class="eyebrow">INTERACTIVE RUNTIME</p><h1>See your code<br><em>think out loud.</em></h1></div><p class="intro-copy">A quiet place to slow JavaScript down.<br>Inspect every step, value, and side effect.</p></section>
    <div class="toolbar"><div class="toolbar-group"><button class="primary" id="run">▶ <span>Run all</span></button><button class="secondary" id="step">Step <b>→</b></button><button class="secondary" id="rewind">↶ First line</button><button class="secondary" id="pause" disabled>Pause</button></div><div class="toolbar-group"><label class="speed-label">SPEED <select id="speed"><option value="700">Slow</option><option value="350" selected>Normal</option><option value="100">Fast</option></select></label><span class="hint">⌘ ↵ to run</span></div></div>
    <div class="workspace"><section class="panel editor-panel"><div class="panel-head"><span><span class="dot coral"></span> editor.js</span><span class="muted">JavaScript</span></div><div class="editor-wrap"><div class="gutter" id="gutter"></div><textarea id="editor" spellcheck="false" aria-label="JavaScript editor"></textarea></div></section>
      <section class="panel trace-panel"><div class="panel-head"><span><span class="dot mint"></span> execution trace</span><span class="step-count" id="step-count">step 0 / 0</span></div><div class="trace-list" id="trace-list"></div><div class="trace-footer"><span class="pulse"></span><span id="trace-status">Ready to trace</span></div></section>
      <aside class="side-column"><section class="panel canvas-panel"><div class="panel-head"><span><span class="dot coral"></span> turtle canvas</span><button id="clear-canvas" class="text-button">clear</button></div><div class="canvas-wrap"><canvas id="turtle-canvas" width="420" height="260"></canvas></div></section><section class="panel variables"><div class="panel-head"><span><span class="dot yellow"></span> variables</span><span class="muted">local scope</span></div><div class="variable-list" id="variables"></div></section><section class="panel console"><div class="panel-head"><span><span class="dot blue"></span> console</span><button id="clear-console" class="text-button">clear</button></div><div id="console-output" class="console-output"></div></section></aside>
    </div>
  </main><footer><span>TRACE / 01</span><span>Everything runs locally in your browser</span></footer>`

const editor = document.querySelector<HTMLTextAreaElement>('#editor')!
const gutter = document.querySelector<HTMLElement>('#gutter')!
const canvas = document.querySelector<HTMLCanvasElement>('#turtle-canvas')!
const context = canvas.getContext('2d')!
const stepCount = document.querySelector<HTMLElement>('#step-count')!
const traceStatus = document.querySelector<HTMLElement>('#trace-status')!
const traceList = document.querySelector<HTMLElement>('#trace-list')!
const variables = document.querySelector<HTMLElement>('#variables')!
const consoleOutput = document.querySelector<HTMLElement>('#console-output')!
const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!
const speed = document.querySelector<HTMLSelectElement>('#speed')!
editor.value = state.code

function createTurtle(): TurtleApi {
  const turtle = state.turtleState
  context.lineCap = 'round'
  context.lineJoin = 'round'
  return {
    forward(distance) { move(Number(distance)) },
    backward(distance) { move(-Number(distance)) },
    right(degrees) { turtle.angle += Number(degrees) },
    left(degrees) { turtle.angle -= Number(degrees) },
    goto(x, y) { moveTo(Number(x) + canvas.width / 2, canvas.height / 2 - Number(y)) },
    penUp() { turtle.pen = false },
    penDown() { turtle.pen = true },
    color(value) { turtle.color = value },
    width(value) { turtle.width = Number(value) },
    home() { moveTo(canvas.width / 2, canvas.height / 2); turtle.angle = -90 },
    clear() { clearCanvas() },
  }

  function move(distance: number): void {
    const radians = turtle.angle * Math.PI / 180
    moveTo(turtle.x + Math.cos(radians) * distance, turtle.y + Math.sin(radians) * distance)
  }

  function moveTo(x: number, y: number): void {
    const nextX = Math.max(0, Math.min(canvas.width, x))
    const nextY = Math.max(0, Math.min(canvas.height, y))
    if (turtle.pen) {
      state.turtlePath.push({ fromX: turtle.x, fromY: turtle.y, toX: nextX, toY: nextY, color: turtle.color, width: turtle.width })
    }
    turtle.x = nextX
    turtle.y = nextY
    redrawCanvas()
  }
}

function drawTurtle(): void {
  const turtle = state.turtleState
  if (!turtle) return
  const radians = turtle.angle * Math.PI / 180
  context.save()
  context.translate(turtle.x, turtle.y)
  context.rotate(radians)

  // Feet sit behind the shell so the turtle reads clearly at every angle.
  context.fillStyle = '#75b893'
  for (const [x, y] of [[-7, -9], [-7, 9], [6, -9], [6, 9]]) {
    context.beginPath()
    context.ellipse(x, y, 5, 3.5, 0, 0, Math.PI * 2)
    context.fill()
  }

  context.beginPath()
  context.ellipse(-1, 0, 13, 10, 0, 0, Math.PI * 2)
  context.fillStyle = '#3f9d78'
  context.fill()
  context.lineWidth = 1.5
  context.strokeStyle = '#267258'
  context.stroke()

  context.beginPath()
  context.ellipse(2, 0, 8, 6, 0, 0, Math.PI * 2)
  context.fillStyle = '#8bc9a0'
  context.fill()

  context.beginPath()
  context.ellipse(13, 0, 6, 5.5, 0, 0, Math.PI * 2)
  context.fillStyle = '#75b893'
  context.fill()
  context.strokeStyle = '#267258'
  context.stroke()

  context.fillStyle = '#17211d'
  context.beginPath()
  context.arc(15, -2.2, 1.1, 0, Math.PI * 2)
  context.arc(15, 2.2, 1.1, 0, Math.PI * 2)
  context.fill()

  context.beginPath()
  context.arc(18, 0, 1.2, 0, Math.PI)
  context.strokeStyle = '#267258'
  context.lineWidth = 1
  context.stroke()
  context.restore()
}

function clearCanvas(): void {
  state.turtlePath = []
  redrawCanvas()
}

function redrawCanvas(): void {
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#fbfaf7'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#e8ebe5'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(canvas.width / 2, 0); context.lineTo(canvas.width / 2, canvas.height)
  context.moveTo(0, canvas.height / 2); context.lineTo(canvas.width, canvas.height / 2)
  context.stroke()
  for (const segment of state.turtlePath) {
    context.beginPath()
    context.moveTo(segment.fromX, segment.fromY)
    context.lineTo(segment.toX, segment.toY)
    context.strokeStyle = segment.color
    context.lineWidth = segment.width
    context.stroke()
  }
  drawTurtle()
}

function render(): void {
  state.lines = editor.value.split('\n')
  gutter.innerHTML = state.lines.map((_, i) => `<span class="${i === state.pointer ? 'current' : ''} ${i < state.pointer ? 'done' : ''}">${String(i + 1).padStart(2, '0')}</span>`).join('')
  stepCount.textContent = `step ${Math.min(state.pointer, state.lines.length)} / ${state.lines.length}`
  traceStatus.textContent = state.pointer >= state.lines.length ? 'Execution complete' : state.pointer ? 'Paused at current line' : 'Ready to trace'
  traceList.innerHTML = state.lines.map((line, i) => `<div class="trace-row ${i === state.pointer ? 'active' : ''} ${i < state.pointer ? 'visited' : ''}"><span>${String(i + 1).padStart(2, '0')}</span><code>${escapeHtml(line) || '&nbsp;'}</code>${i === state.pointer ? '<b>●</b>' : ''}</div>`).join('')
  variables.innerHTML = Object.keys(state.scope).length ? Object.entries(state.scope).map(([key, value]) => `<div class="variable"><span>${key}</span><code>${escapeHtml(String(value))}</code></div>`).join('') : '<div class="empty">No values yet</div>'
  consoleOutput.innerHTML = state.logs.length ? state.logs.map(log => `<div><span>›</span>${escapeHtml(log)}</div>`).join('') : '<div class="empty">Console output will appear here</div>'
  redrawCanvas()
}

function escapeHtml(value: string): string { return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char) }
function parseForLoop(startIndex: number): number | Omit<ForLoop, 'bodyStart'> {
  const header = state.lines[startIndex].trim().match(/^for\s*\(\s*(?:(let|const|var)\s+)?(\w+)\s*=\s*([^;]+);\s*([^;]+);\s*([^\)]+)\s*\)\s*\{?$/)
  if (!header) return startIndex
  let endIndex = startIndex
  let depth = 0
  for (; endIndex < state.lines.length; endIndex += 1) {
    depth += (state.lines[endIndex].match(/\{/g) || []).length
    depth -= (state.lines[endIndex].match(/\}/g) || []).length
    if (depth === 0) break
  }
  return { endIndex, declaration: header[1] ? `${header[1]} ${header[2]} = ${header[3]}` : `${header[2]} = ${header[3]}`, condition: header[4], update: header[5] }
}
function executeLine(line: string): void {
  const source = line.trim()
  const declaration = source.match(/^(const|let|var)\s+(\w+)\s*=\s*(.*)$/)
  const cleaned = declaration ? `${declaration[2]} = ${declaration[3]}` : source.replace(/^(const|let|var)\s+/, '')
  if (!cleaned || cleaned.startsWith('//') || cleaned === '{' || cleaned === '}') return
  const logMatch = cleaned.match(/^console\.log\((.*)\);?$/)
  try {
    if (declaration) {
      state.scope[declaration[2]] = new Function('scope', `with (scope) { return (${declaration[3].replace(/;$/, '')}) }`)(state.scope)
      return
    }
    if (logMatch) { const result = new Function('scope', `with (scope) { return (${logMatch[1]}) }`)(state.scope); state.logs.push(String(result)); return }
    const expression = cleaned.replace(/;$/, '')
    new Function('scope', `with (scope) { ${expression} }`)(state.scope)
    const assignment = expression.match(/^(\w+)\s*(?:\+?=|=)/)
    if (assignment) state.scope[assignment[1]] = new Function('scope', `with (scope) { return ${assignment[1]} }`)(state.scope)
  } catch (error: unknown) { state.logs.push(`Error: ${error instanceof Error ? error.message : String(error)}`) }
}
function step(): void {
  if (state.pointer >= state.lines.length) return
  const currentLine = state.lines[state.pointer].trim()
  if (currentLine.startsWith('for ')) {
    const loop = parseForLoop(state.pointer)
    if (typeof loop === 'object') {
      executeLine(loop.declaration)
      state.activeLoop = { ...loop, bodyStart: state.pointer + 1 }
      state.pointer += 1
    } else {
      executeLine(state.lines[state.pointer]); state.pointer += 1
    }
  } else if (state.activeLoop && state.pointer === state.activeLoop.endIndex) {
    executeLine(state.lines[state.pointer])
    executeLine(state.activeLoop.update)
    const continues = new Function('scope', `with (scope) { return (${state.activeLoop.condition}) }`)(state.scope)
    state.pointer = continues ? state.activeLoop.bodyStart : state.activeLoop.endIndex + 1
    if (!continues) state.activeLoop = null
  } else {
    executeLine(state.lines[state.pointer]); state.pointer += 1
  }
  render()
}
function reset(): void { state.pointer = 0; state.activeLoop = null; state.turtleState = { x: canvas.width / 2, y: canvas.height / 2, angle: -90, pen: true, color: '#e56d52', width: 3 }; state.scope = { turtle: createTurtle() }; state.logs = []; state.running = false; clearCanvas(); pauseButton.disabled = true; render() }
async function run(): Promise<void> { if (state.running) return; state.running = true; pauseButton.disabled = false; while (state.running && state.pointer < state.lines.length) { step(); await new Promise(resolve => setTimeout(resolve, Number(speed.value))) } state.running = false; pauseButton.disabled = true; render() }

document.querySelector<HTMLButtonElement>('#run')!.addEventListener('click', () => { reset(); void run() })
document.querySelector<HTMLButtonElement>('#step')!.addEventListener('click', step)
document.querySelector<HTMLButtonElement>('#rewind')!.addEventListener('click', reset)
pauseButton.addEventListener('click', () => { state.running = false })
document.querySelector<HTMLButtonElement>('#reset')!.addEventListener('click', reset)
document.querySelector<HTMLButtonElement>('#clear-console')!.addEventListener('click', () => { state.logs = []; render() })
document.querySelector<HTMLButtonElement>('#clear-canvas')!.addEventListener('click', () => { clearCanvas(); state.turtleState = { x: canvas.width / 2, y: canvas.height / 2, angle: -90, pen: true, color: '#e56d52', width: 3 }; redrawCanvas() })
editor.addEventListener('input', () => { if (!state.running) { state.code = editor.value; reset() } })
editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop })
document.addEventListener('keydown', (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); document.querySelector<HTMLButtonElement>('#run')!.click() } })
reset()

/* Vite starter markup replaced by the trace workspace above. */
/*
<section id="center">
  <div class="hero">
    <img src="${heroImg}" class="base" width="170" height="179">
    <img src="${javascriptLogo}" class="framework" alt="JavaScript logo"/>
    <img src="${viteLogo}" class="vite" alt="Vite logo" />
  </div>
  <div>
    <h1>Get started</h1>
    <p>Edit <code>src/main.js</code> and save to test <code>HMR</code></p>
  </div>
  <button id="counter" type="button" class="counter"></button>
</section>

<div class="ticks"></div>

<section id="next-steps">
  <div id="docs">
    <svg class="icon" role="presentation" aria-hidden="true"><use href="/icons.svg#documentation-icon"></use></svg>
    <h2>Documentation</h2>
    <p>Your questions, answered</p>
    <ul>
      <li>
        <a href="https://vite.dev/" target="_blank">
          <img class="logo" src="${viteLogo}" alt="" />
          Explore Vite
        </a>
      </li>
      <li>
        <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
          <img class="button-icon" src="${javascriptLogo}" alt="">
          Learn more
        </a>
      </li>
    </ul>
  </div>
  <div id="social">
    <svg class="icon" role="presentation" aria-hidden="true"><use href="/icons.svg#social-icon"></use></svg>
    <h2>Connect with us</h2>
    <p>Join the Vite community</p>
    <ul>
      <li><a href="https://github.com/vitejs/vite" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#github-icon"></use></svg>GitHub</a></li>
      <li><a href="https://chat.vite.dev/" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#discord-icon"></use></svg>Discord</a></li>
      <li><a href="https://x.com/vite_js" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#x-icon"></use></svg>X.com</a></li>
      <li><a href="https://bsky.app/profile/vite.dev" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#bluesky-icon"></use></svg>Bluesky</a></li>
    </ul>
  </div>
</section>

<div class="ticks"></div>
<section id="spacer"></section>
`*/
