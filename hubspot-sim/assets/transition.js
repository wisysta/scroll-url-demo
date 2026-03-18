/**
 * HubSpot Global JS — 모든 페이지 공통 적용
 * (HubSpot: Design Manager > JS > 글로벌 푸터에 삽입)
 *
 * 각 페이지 HTML에서 data 속성으로 메타 정보를 주입:
 *   <div id="page-meta"
 *        data-label="Page A"
 *        data-url="/work/branding"
 *        data-next="/work/campaign"
 *        data-prev="">
 */

(function () {
  const meta         = document.getElementById('page-meta')
  const overlay      = document.getElementById('loading-overlay')
  const loadingBar   = document.getElementById('loading-bar')
  const urlBar       = document.getElementById('url-bar')
  const pageLabel    = document.getElementById('page-label')
  const scrollHint   = document.getElementById('scroll-hint')

  if (!meta || !overlay) return

  const PAGE_LABEL = meta.dataset.label
  const PAGE_URL   = meta.dataset.url
  const NEXT_URL   = meta.dataset.next || null
  const PREV_URL   = meta.dataset.prev || null

  let isTransitioning = false
  let scrolled        = false
  let sentinelActive  = false

  // URL 바 초기화
  if (urlBar) urlBar.innerHTML = `localhost:3000<span>${PAGE_URL}</span>`

  // 섹션 in-view 애니메이션
  const sections = document.querySelectorAll('.section')
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view')
        const idx = +e.target.dataset.index
        if (pageLabel) pageLabel.textContent = `${PAGE_LABEL} — ${idx + 1} / ${sections.length}`
      }
    })
  }, { threshold: 0.5 })
  sections.forEach(s => sectionObserver.observe(s))

  // 페이지 레이블 초기화
  if (pageLabel) pageLabel.textContent = `${PAGE_LABEL} — 1 / ${sections.length}`

  // 센티넬 (다음 페이지 트리거)
  const sentinel = document.querySelector('.sentinel')
  if (sentinel && NEXT_URL) {
    const sentinelObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => { sentinelActive = e.isIntersecting })
    }, { threshold: 0 })
    sentinelObserver.observe(sentinel)
  }

  // 트랜지션 실행 공통 함수
  function runTransition(targetUrl) {
    if (isTransitioning) return
    isTransitioning = true
    document.body.style.overflow = 'hidden'

    loadingBar.style.animation = 'none'
    overlay.classList.add('visible')

    requestAnimationFrame(() => requestAnimationFrame(() => {
      loadingBar.style.animation = 'barSlide 1s cubic-bezier(0.4,0,0.2,1) forwards'
    }))

    setTimeout(() => {
      window.location.href = targetUrl   // ← 실제 페이지 이동 (HubSpot 방식)
    }, 900)
  }

  // Scroll hint 숨김
  window.addEventListener('scroll', () => {
    if (!scrolled && window.scrollY > 60) {
      scrolled = true
      if (scrollHint) scrollHint.style.opacity = '0'
    }
  }, { passive: true })

  // Wheel — 앞으로
  window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0 && sentinelActive && NEXT_URL) {
      const rect = sentinel.getBoundingClientRect()
      if (rect.bottom <= window.innerHeight + 20) runTransition(NEXT_URL)
    } else if (e.deltaY < 0 && PREV_URL && window.scrollY === 0) {
      runTransition(PREV_URL)
    }
  }, { passive: true })

  // Touch
  let touchStartY = 0
  window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY }, { passive: true })
  window.addEventListener('touchend', e => {
    const dy = touchStartY - e.changedTouches[0].clientY
    if (dy > 40 && sentinelActive && NEXT_URL) {
      const rect = sentinel.getBoundingClientRect()
      if (rect.bottom <= window.innerHeight + 20) runTransition(NEXT_URL)
    } else if (dy < -40 && PREV_URL && window.scrollY === 0) {
      runTransition(PREV_URL)
    }
  }, { passive: true })

  // 페이지 진입 시 오버레이 fade-out (뒤로가기 대응)
  window.addEventListener('pageshow', () => {
    overlay.classList.remove('visible')
    document.body.style.overflow = ''
    isTransitioning = false
  })

})()
