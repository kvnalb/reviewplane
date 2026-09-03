import { describe, expect, it } from 'vitest'
import { clampPopup, intersectionRatio, LASSO_INTERSECTION_THRESHOLD, rectangleFromPoints } from './geometry.ts'

describe('overlay geometry', () => {
  it('normalizes a lasso dragged in any direction', () => {
    expect(rectangleFromPoints({ x: 80, y: 60 }, { x: 20, y: 10 })).toEqual({ left: 20, top: 10, right: 80, bottom: 60, width: 60, height: 50 })
  })

  it('uses target area for the documented lasso threshold', () => {
    const target = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }
    const quarter = { left: 0, top: 0, right: 50, bottom: 50, width: 50, height: 50 }
    expect(intersectionRatio(quarter, target)).toBe(LASSO_INTERSECTION_THRESHOLD)
  })

  it('flips and clamps popups inside the viewport', () => {
    const anchor = { left: 780, top: 700, right: 800, bottom: 720, width: 20, height: 20 }
    expect(clampPopup(anchor, { width: 390, height: 430 }, { width: 900, height: 760 })).toEqual({ left: 498, top: 258 })
  })
})
