import './style.css'
import pages from './pages/index.js'
import { resolve } from './router.js'

// ── Shell ──
document.getElementById('app').innerHTML = `
  <div id="url-bar">localhost:3000<span id="url-path"></span></div>
  <div id="scroll-hint"><p>Scroll</p><div class="arrow-line"></div></div>
  <div id="page-label"></div>
  <div id="loading-overlay">
    <p class="loading-label" id="loading-text">Loading</p>
    <div class="loading-bar-track"><div class="loading-bar-fill" id="loading-bar"></div></div>
  </div>
  <div id="page-content"></div>
`

const overlay    = document.getElementById('loading-overlay')
const loadingBar = document.getElementById('loading-bar')
const loadingTxt = document.getElementById('loading-text')
const urlPath    = document.getElementById('url-path')
const pageLabel  = document.getElementById('page-label')
const scrollHint = document.getElementById('scroll-hint')
const pageContent = document.getElementById('page-content')

let isTransitioning = false
let scrolled = false
let sectionObserver = null
let sentinelObserver = null
let activeSentinel = null

// ── Render ──
function renderPage(page, bridgeSection = null, direction = 'forward') {
  if (sectionObserver) sectionObserver.disconnect()
  if (sentinelObserver) sentinelObserver.disconnect()
  activeSentinel = null

  const lastIdx = page.sections.length - 1
  const html = page.sections.map((s, i) => {
    const isBridge = bridgeSection && (direction === 'forward' ? i === 0 : i === lastIdx)
    const content = isBridge ? bridgeSection : s
    return `
    <section class="section" data-index="${i}">
      <div class="section-bg" style="background-image:url('${s.image}')"></div>
      <div class="section-overlay"></div>
      <div class="section-content">
        <p class="section-tag">${content.tag}</p>
        <h2>${content.title}</h2>
        <p>${content.body}</p>
      </div>
    </section>
    ${i < lastIdx ? '<div class="divider"></div>' : ''}
  `}).join('') + (page.next ? `<div class="sentinel" data-next-url="${page.next}"></div>` : '')

  pageContent.innerHTML = html

  if (direction === 'reverse') {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    const allSections = pageContent.querySelectorAll('.section')
    const last = allSections[allSections.length - 1]
    if (last && bridgeSection) last.classList.add('no-anim', 'in-view')
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (bridgeSection) {
      const first = pageContent.querySelector('.section')
      if (first) first.classList.add('no-anim', 'in-view')
    }
  }

  urlPath.textContent = page.url
  window.history.replaceState({}, '', page.url)
  pageLabel.textContent = `${page.label} — 1 / ${page.sections.length}`

  // Section in-view animation
  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view')
        pageLabel.textContent = `${page.label} — ${+e.target.dataset.index + 1} / ${page.sections.length}`
      }
    })
  }, { threshold: 0.5 })
  pageContent.querySelectorAll('.section').forEach(s => sectionObserver.observe(s))

  // Sentinel
  const sentinel = pageContent.querySelector('.sentinel')
  if (sentinel) {
    sentinelObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          activeSentinel = e.target
          // Preload next page first image
          const next = pages.find(p => p.url === sentinel.dataset.nextUrl)
          if (next) { const img = new Image(); img.src = next.sections[0].image }
        } else {
          if (activeSentinel === e.target) activeSentinel = null
        }
      })
    }, { threshold: 0 })
    sentinelObserver.observe(sentinel)
  }
}

// ── Transition ──
function triggerTransition(nextUrl) {
  if (isTransitioning) return
  const next = pages.find(p => p.url === nextUrl)
  if (!next) return

  // 현재 페이지 마지막 섹션 텍스트 캡처
  const currentSections = pageContent.querySelectorAll('.section')
  const lastSection = currentSections[currentSections.length - 1]
  const bridge = lastSection ? {
    tag:   lastSection.querySelector('.section-tag').textContent,
    title: lastSection.querySelector('h2').innerHTML,
    body:  lastSection.querySelector('p:not(.section-tag)').textContent,
  } : null

  isTransitioning = true
  document.body.style.overflow = 'hidden'

  loadingTxt.textContent = 'Loading'
  loadingBar.style.animation = 'none'
  overlay.classList.add('visible')

  requestAnimationFrame(() => requestAnimationFrame(() => {
    loadingBar.style.animation = 'barSlide 1s cubic-bezier(0.4,0,0.2,1) forwards'
  }))

  setTimeout(() => renderPage(next, bridge, 'forward'), 900)

  setTimeout(() => {
    overlay.classList.remove('visible')
    setTimeout(() => {
      document.body.style.overflow = ''
      isTransitioning = false
    }, 400)
  }, 1300)
}

// ── Reverse Transition ──
function triggerReverseTransition(prevUrl) {
  if (isTransitioning) return
  const prev = pages.find(p => p.url === prevUrl)
  if (!prev) return

  const firstSection = pageContent.querySelector('.section')
  const bridge = firstSection ? {
    tag:   firstSection.querySelector('.section-tag').textContent,
    title: firstSection.querySelector('h2').innerHTML,
    body:  firstSection.querySelector('p:not(.section-tag)').textContent,
  } : null

  isTransitioning = true
  document.body.style.overflow = 'hidden'

  loadingTxt.textContent = 'Loading'
  loadingBar.style.animation = 'none'
  overlay.classList.add('visible')

  requestAnimationFrame(() => requestAnimationFrame(() => {
    loadingBar.style.animation = 'barSlide 1s cubic-bezier(0.4,0,0.2,1) forwards'
  }))

  setTimeout(() => renderPage(prev, bridge, 'reverse'), 900)

  setTimeout(() => {
    overlay.classList.remove('visible')
    setTimeout(() => {
      document.body.style.overflow = ''
      isTransitioning = false
    }, 400)
  }, 1300)
}

// ── Scroll hint ──
window.addEventListener('scroll', () => {
  if (!scrolled && window.scrollY > 60) {
    scrolled = true
    scrollHint.style.opacity = '0'
  }
}, { passive: true })

// ── Wheel ──
window.addEventListener('wheel', (e) => {
  if (e.deltaY > 0 && activeSentinel && !isTransitioning) {
    const rect = activeSentinel.getBoundingClientRect()
    if (rect.bottom <= window.innerHeight + 20) {
      triggerTransition(activeSentinel.dataset.nextUrl)
    }
  } else if (e.deltaY < 0 && !isTransitioning && window.scrollY === 0) {
    const cur = pages.find(p => p.url === window.location.pathname)
    if (cur?.prev) triggerReverseTransition(cur.prev)
  }
}, { passive: true })

// ── Touch ──
let touchStartY = 0
window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY }, { passive: true })
window.addEventListener('touchend', e => {
  const dy = touchStartY - e.changedTouches[0].clientY
  if (dy > 40 && activeSentinel && !isTransitioning) {
    const rect = activeSentinel.getBoundingClientRect()
    if (rect.bottom <= window.innerHeight + 20) {
      triggerTransition(activeSentinel.dataset.nextUrl)
    }
  } else if (dy < -40 && !isTransitioning && window.scrollY === 0) {
    const cur = pages.find(p => p.url === window.location.pathname)
    if (cur?.prev) triggerReverseTransition(cur.prev)
  }
}, { passive: true })

// ── Init ──
renderPage(resolve(window.location.pathname))
