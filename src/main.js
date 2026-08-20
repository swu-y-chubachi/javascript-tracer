import './style.css'

const starterCode = `const length = 70;

turtle.forward(length);
turtle.right(60);
turtle.forward(length);
turtle.right(60);
turtle.forward(length);
turtle.right(60);
turtle.forward(length);
turtle.right(60);
turtle.forward(length);
turtle.right(60);
turtle.forward(length);
turtle.right(60);`

const app = document.querySelector('#app')
const state = { code: starterCode, lines: [], pointer: 0, scope: {}, logs: [], running: false, turtle: null }

app.innerHTML = `
  <header class="topbar"><div class="brand"><span class="brand-mark">✦</span><span>TRACE</span><small>JS playground</small></div><div class="top-actions"><span class="status"><i></i> Browser runtime</span><button class="icon-button" id="reset" title="Reset trace">↺</button></div></header>
  <main><section class="intro"><div><p class="eyebrow">INTERACTIVE RUNTIME</p><h1>See your code<br><em>think out loud.</em></h1></div><p class="intro-copy">A quiet place to slow JavaScript down.<br>Inspect every step, value, and side effect.</p></section>
    <div class="toolbar"><div class="toolbar-group"><button class="primary" id="run">▶ <span>Run all</span></button><button class="secondary" id="step">Step <b>→</b></button><button class="secondary" id="rewind">↶ First line</button><button class="secondary" id="pause" disabled>Pause</button></div><div class="toolbar-group"><label class="speed-label">SPEED <select id="speed"><option value="700">Slow</option><option value="350" selected>Normal</option><option value="100">Fast</option></select></label><span class="hint">⌘ ↵ to run</span></div></div>
    <div class="workspace"><section class="panel editor-panel"><div class="panel-head"><span><span class="dot coral"></span> editor.js</span><span class="muted">JavaScript</span></div><div class="editor-wrap"><div class="gutter" id="gutter"></div><textarea id="editor" spellcheck="false" aria-label="JavaScript editor"></textarea></div></section>
      <section class="panel trace-panel"><div class="panel-head"><span><span class="dot mint"></span> execution trace</span><span class="step-count" id="step-count">step 0 / 0</span></div><div class="trace-list" id="trace-list"></div><div class="trace-footer"><span class="pulse"></span><span id="trace-status">Ready to trace</span></div></section>
      <aside class="side-column"><section class="panel canvas-panel"><div class="panel-head"><span><span class="dot coral"></span> turtle canvas</span><button id="clear-canvas" class="text-button">clear</button></div><div class="canvas-wrap"><canvas id="turtle-canvas" width="420" height="260"></canvas></div></section><section class="panel variables"><div class="panel-head"><span><span class="dot yellow"></span> variables</span><span class="muted">local scope</span></div><div class="variable-list" id="variables"></div></section><section class="panel console"><div class="panel-head"><span><span class="dot blue"></span> console</span><button id="clear-console" class="text-button">clear</button></div><div id="console-output" class="console-output"></div></section></aside>
    </div>
  </main><footer><span>TRACE / 01</span><span>Everything runs locally in your browser</span></footer>`

const editor = document.querySelector('#editor')
const gutter = document.querySelector('#gutter')
const canvas = document.querySelector('#turtle-canvas')
const context = canvas.getContext('2d')
editor.value = state.code

function createTurtle() {
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

  function move(distance) {
    const radians = turtle.angle * Math.PI / 180
    moveTo(turtle.x + Math.cos(radians) * distance, turtle.y + Math.sin(radians) * distance)
  }

  function moveTo(x, y) {
    const nextX = Math.max(0, Math.min(canvas.width, x))
    const nextY = Math.max(0, Math.min(canvas.height, y))
    if (turtle.pen) {
      context.beginPath()
      context.moveTo(turtle.x, turtle.y)
      context.lineTo(nextX, nextY)
      context.strokeStyle = turtle.color
      context.lineWidth = turtle.width
      context.stroke()
    }
    turtle.x = nextX
    turtle.y = nextY
    drawTurtle()
  }
}

function drawTurtle() {
  const turtle = state.turtleState
  if (!turtle) return
  const radians = turtle.angle * Math.PI / 180
  context.save()
  context.translate(turtle.x, turtle.y)
  context.rotate(radians)
  context.beginPath()
  context.moveTo(10, 0)
  context.lineTo(-7, -6)
  context.lineTo(-4, 0)
  context.lineTo(-7, 6)
  context.closePath()
  context.fillStyle = '#17211d'
  context.fill()
  context.restore()
}

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#fbfaf7'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#e8ebe5'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(canvas.width / 2, 0); context.lineTo(canvas.width / 2, canvas.height)
  context.moveTo(0, canvas.height / 2); context.lineTo(canvas.width, canvas.height / 2)
  context.stroke()
}

function render() {
  state.lines = editor.value.split('\n')
  gutter.innerHTML = state.lines.map((_, i) => `<span class="${i === state.pointer ? 'current' : ''} ${i < state.pointer ? 'done' : ''}">${String(i + 1).padStart(2, '0')}</span>`).join('')
  document.querySelector('#step-count').textContent = `step ${Math.min(state.pointer, state.lines.length)} / ${state.lines.length}`
  document.querySelector('#trace-status').textContent = state.pointer >= state.lines.length ? 'Execution complete' : state.pointer ? 'Paused at current line' : 'Ready to trace'
  document.querySelector('#trace-list').innerHTML = state.lines.map((line, i) => `<div class="trace-row ${i === state.pointer ? 'active' : ''} ${i < state.pointer ? 'visited' : ''}"><span>${String(i + 1).padStart(2, '0')}</span><code>${escapeHtml(line) || '&nbsp;'}</code>${i === state.pointer ? '<b>●</b>' : ''}</div>`).join('')
  document.querySelector('#variables').innerHTML = Object.keys(state.scope).length ? Object.entries(state.scope).map(([key, value]) => `<div class="variable"><span>${key}</span><code>${escapeHtml(String(value))}</code></div>`).join('') : '<div class="empty">No values yet</div>'
  document.querySelector('#console-output').innerHTML = state.logs.length ? state.logs.map(log => `<div><span>›</span>${escapeHtml(log)}</div>`).join('') : '<div class="empty">Console output will appear here</div>'
  drawTurtle()
}

function escapeHtml(value) { return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]) }
function executeLine(line) {
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
  } catch (error) { state.logs.push(`Error: ${error.message}`) }
}
function step() { if (state.pointer >= state.lines.length) return; executeLine(state.lines[state.pointer]); state.pointer += 1; render() }
function reset() { state.pointer = 0; state.turtleState = { x: canvas.width / 2, y: canvas.height / 2, angle: -90, pen: true, color: '#e56d52', width: 3 }; state.scope = { turtle: createTurtle() }; state.logs = []; state.running = false; clearCanvas(); document.querySelector('#pause').disabled = true; render() }
async function run() { if (state.running) return; state.running = true; document.querySelector('#pause').disabled = false; while (state.running && state.pointer < state.lines.length) { step(); await new Promise(resolve => setTimeout(resolve, Number(document.querySelector('#speed').value))) } state.running = false; document.querySelector('#pause').disabled = true; render() }

document.querySelector('#run').addEventListener('click', () => { reset(); run() })
document.querySelector('#step').addEventListener('click', step)
document.querySelector('#rewind').addEventListener('click', reset)
document.querySelector('#pause').addEventListener('click', () => { state.running = false })
document.querySelector('#reset').addEventListener('click', reset)
document.querySelector('#clear-console').addEventListener('click', () => { state.logs = []; render() })
document.querySelector('#clear-canvas').addEventListener('click', () => { clearCanvas(); state.turtleState = { x: canvas.width / 2, y: canvas.height / 2, angle: -90, pen: true, color: '#e56d52', width: 3 }; drawTurtle() })
editor.addEventListener('input', () => { if (!state.running) { state.code = editor.value; reset() } })
editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop })
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); document.querySelector('#run').click() } })
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
