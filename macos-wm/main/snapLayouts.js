const LAYOUTS = {
  'left-half':        (s) => ({ x: s.x, y: s.y, width: s.width / 2, height: s.height }),
  'right-half':       (s) => ({ x: s.x + s.width / 2, y: s.y, width: s.width / 2, height: s.height }),
  'top-half':         (s) => ({ x: s.x, y: s.y, width: s.width, height: s.height / 2 }),
  'bottom-half':      (s) => ({ x: s.x, y: s.y + s.height / 2, width: s.width, height: s.height / 2 }),
  'top-left':         (s) => ({ x: s.x, y: s.y, width: s.width / 2, height: s.height / 2 }),
  'top-right':        (s) => ({ x: s.x + s.width / 2, y: s.y, width: s.width / 2, height: s.height / 2 }),
  'bottom-left':      (s) => ({ x: s.x, y: s.y + s.height / 2, width: s.width / 2, height: s.height / 2 }),
  'bottom-right':     (s) => ({ x: s.x + s.width / 2, y: s.y + s.height / 2, width: s.width / 2, height: s.height / 2 }),
  'left-third':       (s) => ({ x: s.x, y: s.y, width: Math.round(s.width / 3), height: s.height }),
  'center-third':     (s) => ({ x: s.x + Math.round(s.width / 3), y: s.y, width: Math.round(s.width / 3), height: s.height }),
  'right-third':      (s) => ({ x: s.x + Math.round(s.width * 2 / 3), y: s.y, width: s.width - Math.round(s.width * 2 / 3), height: s.height }),
  'left-two-thirds':  (s) => ({ x: s.x, y: s.y, width: Math.round(s.width * 2 / 3), height: s.height }),
  'right-two-thirds': (s) => ({ x: s.x + Math.round(s.width / 3), y: s.y, width: s.width - Math.round(s.width / 3), height: s.height }),
  'maximize':         (s) => ({ x: s.x, y: s.y, width: s.width, height: s.height }),
}

export function computeFrame(layoutId, screen) {
  const fn = LAYOUTS[layoutId]
  if (!fn) throw new Error(`Unknown layout: ${layoutId}`)
  return fn(screen)
}
