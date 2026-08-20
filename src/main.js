import './style.css'

const starterCode = `const subtotal = 48;
const taxRate = 0.1;
const tax = subtotal * taxRate;
const total = subtotal + tax;

console.log(total);`

const app = document.querySelector('#app')
const state = { code: starterCode, lines: [], pointer: 0, scope: {}, logs: [], running: false }

app.innerHTML = `
  <header class="topbar"><div class="brand"><span class="brand-mark">✦</span><span>TRACE</span><small>JS playground</small></div><div class="top-actions"><span class="status"><i></i> Browser runtime</span><button class="icon-button" id="reset" title="Reset trace">↺</button></div></header>
  <main><section class="intro"><div><p class="eyebrow">INTERACTIVE RUNTIME</p><h1>See your code<br><em>think out loud.</em></h1></div><p class="intro-copy">A quiet place to slow JavaScript down.<br>Inspect every step, value, and side effect.</p></section>
    <div class="toolbar"><div class="toolbar-group"><button class="primary" id="run">▶ <span>Run all</span></button><button class="secondary" id="step">Step <b>→</b></button><button class="secondary" id="pause" disabled>Pause</button></div><div class="toolbar-group"><label class="speed-label">SPEED <select id="speed"><option value="700">Slow</option><option value="350" selected>Normal</option><option value="100">Fast</option></select></label><span class="hint">⌘ ↵ to run</span></div></div>
    <div class="workspace"><section class="panel editor-panel"><div class="panel-head"><span><span class="dot coral"></span> editor.js</span><span class="muted">JavaScript</span></div><div class="editor-wrap"><div class="gutter" id="gutter"></div><textarea id="editor" spellcheck="false" aria-label="JavaScript editor"></textarea></div></section>
      <section class="panel trace-panel"><div class="panel-head"><span><span class="dot mint"></span> execution trace</span><span class="step-count" id="step-count">step 0 / 0</span></div><div class="trace-list" id="trace-list"></div><div class="trace-footer"><span class="pulse"></span><span id="trace-status">Ready to trace</span></div></section>
      <aside class="side-column"><section class="panel variables"><div class="panel-head"><span><span class="dot yellow"></span> variables</span><span class="muted">local scope</span></div><div class="variable-list" id="variables"></div></section><section class="panel console"><div class="panel-head"><span><span class="dot blue"></span> console</span><button id="clear-console" class="text-button">clear</button></div><div id="console-output" class="console-output"></div></section></aside>
    </div>
  </main><footer><span>TRACE / 01</span><span>Everything runs locally in your browser</span></footer>`

const editor = document.querySelector('#editor')
const gutter = document.querySelector('#gutter')
editor.value = state.code

function render() {
  state.lines = editor.value.split('\n')
  gutter.innerHTML = state.lines.map((_, i) => `<span class="${i === state.pointer ? 'current' : ''} ${i < state.pointer ? 'done' : ''}">${String(i + 1).padStart(2, '0')}</span>`).join('')
  document.querySelector('#step-count').textContent = `step ${Math.min(state.pointer, state.lines.length)} / ${state.lines.length}`
  document.querySelector('#trace-status').textContent = state.pointer >= state.lines.length ? 'Execution complete' : state.pointer ? 'Paused at current line' : 'Ready to trace'
  document.querySelector('#trace-list').innerHTML = state.lines.map((line, i) => `<div class="trace-row ${i === state.pointer ? 'active' : ''} ${i < state.pointer ? 'visited' : ''}"><span>${String(i + 1).padStart(2, '0')}</span><code>${escapeHtml(line) || '&nbsp;'}</code>${i === state.pointer ? '<b>●</b>' : ''}</div>`).join('')
  document.querySelector('#variables').innerHTML = Object.keys(state.scope).length ? Object.entries(state.scope).map(([key, value]) => `<div class="variable"><span>${key}</span><code>${escapeHtml(String(value))}</code></div>`).join('') : '<div class="empty">No values yet</div>'
  document.querySelector('#console-output').innerHTML = state.logs.length ? state.logs.map(log => `<div><span>›</span>${escapeHtml(log)}</div>`).join('') : '<div class="empty">Console output will appear here</div>'
}

function escapeHtml(value) { return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]) }
function executeLine(line) {
  const cleaned = line.trim().replace(/^(const|let|var)\s+/, '')
  if (!cleaned || cleaned.startsWith('//') || cleaned === '{' || cleaned === '}') return
  const logMatch = cleaned.match(/^console\.log\((.*)\);?$/)
  try {
    if (logMatch) { const result = new Function('scope', `with (scope) { return (${logMatch[1]}) }`)(state.scope); state.logs.push(String(result)); return }
    const expression = cleaned.replace(/;$/, '')
    new Function('scope', `with (scope) { ${expression} }`)(state.scope)
    const assignment = expression.match(/^(\w+)\s*(?:\+?=|=)/)
    if (assignment) state.scope[assignment[1]] = new Function('scope', `with (scope) { return ${assignment[1]} }`)(state.scope)
  } catch (error) { state.logs.push(`Error: ${error.message}`) }
}
function step() { if (state.pointer >= state.lines.length) return; executeLine(state.lines[state.pointer]); state.pointer += 1; render() }
function reset() { state.pointer = 0; state.scope = {}; state.logs = []; state.running = false; document.querySelector('#pause').disabled = true; render() }
async function run() { if (state.running) return; state.running = true; document.querySelector('#pause').disabled = false; while (state.running && state.pointer < state.lines.length) { step(); await new Promise(resolve => setTimeout(resolve, Number(document.querySelector('#speed').value))) } state.running = false; document.querySelector('#pause').disabled = true; render() }

document.querySelector('#run').addEventListener('click', () => { reset(); run() })
document.querySelector('#step').addEventListener('click', step)
document.querySelector('#pause').addEventListener('click', () => { state.running = false })
document.querySelector('#reset').addEventListener('click', reset)
document.querySelector('#clear-console').addEventListener('click', () => { state.logs = []; render() })
editor.addEventListener('input', () => { if (!state.running) { state.code = editor.value; reset() } })
editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop })
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); document.querySelector('#run').click() } })
render()

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
