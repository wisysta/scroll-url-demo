import pages from './pages/index.js'

const map = {}
pages.forEach(p => { map[p.url] = p })

export function resolve(path) {
  return map[path] || pages[0]
}
