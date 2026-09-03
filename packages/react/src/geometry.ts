export const LASSO_INTERSECTION_THRESHOLD = 0.25

export type Rectangle = Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'>

export function rectangleFromPoints(start: { x: number; y: number }, end: { x: number; y: number }): Rectangle {
  const left = Math.min(start.x, end.x)
  const top = Math.min(start.y, end.y)
  const right = Math.max(start.x, end.x)
  const bottom = Math.max(start.y, end.y)
  return { left, top, right, bottom, width: right - left, height: bottom - top }
}

export function intersectionRatio(selection: Rectangle, target: Rectangle) {
  const width = Math.max(0, Math.min(selection.right, target.right) - Math.max(selection.left, target.left))
  const height = Math.max(0, Math.min(selection.bottom, target.bottom) - Math.max(selection.top, target.top))
  const targetArea = target.width * target.height
  return targetArea > 0 ? (width * height) / targetArea : 0
}

export function clampPopup(rect: Rectangle, popup: { width: number; height: number }, viewport: { width: number; height: number }, gap = 12) {
  const left = Math.min(Math.max(gap, rect.left), Math.max(gap, viewport.width - popup.width - gap))
  const below = rect.bottom + gap
  const top = below + popup.height <= viewport.height - gap
    ? below
    : Math.max(gap, rect.top - popup.height - gap)
  return { left, top }
}

export function removeRedundantTargets(elements: Element[]) {
  return elements.filter((candidate) => !elements.some((other) => candidate !== other && candidate.contains(other)))
}

export function isVisibleTarget(element: Element) {
  const rect = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  return rect.width > 0
    && rect.height > 0
    && style.display !== 'none'
    && style.visibility !== 'hidden'
    && Number(style.opacity) !== 0
}

export function mappedElement(node: Node | null) {
  const element = node instanceof Element ? node : node?.parentElement
  return element?.closest<HTMLElement>('[data-rp-source-id]') ?? null
}
