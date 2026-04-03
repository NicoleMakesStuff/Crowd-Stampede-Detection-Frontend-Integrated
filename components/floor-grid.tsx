"use client"

import { useRef, useEffect, useCallback } from "react"

const GRID_SIZE = 40

function pressureToColor(value: number): [number, number, number] {
  // Green (low) -> Yellow (medium) -> Orange (high) -> Red (critical)
  const v = Math.max(0, Math.min(1, value))

  if (v < 0.25) {
    // Dark teal to bright green
    const t = v / 0.25
    return [
      Math.round(10 + t * 20),
      Math.round(80 + t * 100),
      Math.round(80 + t * 40),
    ]
  } else if (v < 0.5) {
    // Green to yellow
    const t = (v - 0.25) / 0.25
    return [
      Math.round(30 + t * 210),
      Math.round(180 + t * 40),
      Math.round(120 - t * 80),
    ]
  } else if (v < 0.75) {
    // Yellow to orange-red
    const t = (v - 0.5) / 0.25
    return [
      Math.round(240 + t * 15),
      Math.round(220 - t * 130),
      Math.round(40 - t * 20),
    ]
  } else {
    // Orange-red to bright red
    const t = (v - 0.75) / 0.25
    return [
      Math.round(255),
      Math.round(90 - t * 60),
      Math.round(20 + t * 20),
    ]
  }
}

interface FloorGridProps {
  grid: Float32Array
  showRegionOverlay: boolean
  regionGrid: Float32Array
}

export function FloorGrid({ grid, showRegionOverlay, regionGrid }: FloorGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const size = Math.min(rect.width, rect.height)
    const dpr = window.devicePixelRatio || 1

    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.scale(dpr, dpr)

    const cellSize = size / GRID_SIZE
    const gap = 0.5

    // Clear
    ctx.clearRect(0, 0, size, size)

    // Draw cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const value = grid[y * GRID_SIZE + x]
        const [r, g, b] = pressureToColor(value)

        const cx = x * cellSize + gap / 2
        const cy = y * cellSize + gap / 2
        const cw = cellSize - gap
        const ch = cellSize - gap

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(cx, cy, cw, ch)

        // Glow effect for high pressure cells
        if (value > 0.7) {
          const glowIntensity = (value - 0.7) / 0.3
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glowIntensity * 0.8})`
          ctx.shadowBlur = 4 + glowIntensity * 6
          ctx.fillRect(cx, cy, cw, ch)
          ctx.shadowBlur = 0
          ctx.shadowColor = "transparent"
        }
      }
    }

    // Region overlay
    if (showRegionOverlay) {
      const regionCellSize = size / 10

      for (let ry = 0; ry < 10; ry++) {
        for (let rx = 0; rx < 10; rx++) {
          const regionVal = regionGrid[ry * 10 + rx]
          const rx0 = rx * regionCellSize
          const ry0 = ry * regionCellSize

          // Semi-transparent overlay for high regions
          if (regionVal > 0.4) {
            const alpha = Math.min(0.55, (regionVal - 0.4) * 0.9)
            if (regionVal > 0.6) {
              ctx.fillStyle = `rgba(120, 20, 20, ${alpha})`
            } else {
              ctx.fillStyle = `rgba(100, 80, 20, ${alpha})`
            }
            ctx.fillRect(rx0, ry0, regionCellSize, regionCellSize)
          }

          // Border - always black
          ctx.strokeStyle = "rgba(0, 0, 0, 0.85)"
          ctx.lineWidth = regionVal > 0.6 ? 2.5 : 1.5
          ctx.strokeRect(rx0 + 0.5, ry0 + 0.5, regionCellSize - 1, regionCellSize - 1)

          // Label - show grid number (0-99)
          const gridNumber = ry * 10 + rx
          const label = `${gridNumber}`
          const fontSize = Math.max(8, regionCellSize * 0.22)
          ctx.font = `bold ${fontSize}px var(--font-jetbrains-mono), monospace`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"

          // Black text shadow for readability
          ctx.fillStyle = "rgba(0, 0, 0, 0.9)"
          ctx.fillText(label, rx0 + regionCellSize / 2 + 0.5, ry0 + regionCellSize / 2 + 0.5)
          ctx.fillStyle = "rgba(0, 0, 0, 0.95)"
          ctx.fillText(label, rx0 + regionCellSize / 2, ry0 + regionCellSize / 2)
        }
      }
    }
  }, [grid, showRegionOverlay, regionGrid])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const handleResize = () => draw()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [draw])

  return (
    <div ref={containerRef} className="relative aspect-square w-full max-w-[640px]">
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        aria-label="40 by 40 sensor grid heatmap visualization"
        role="img"
      />
      {/* Scan line effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
        <div className="animate-scan-line absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
      </div>
      {/* Border glow */}
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-neon-cyan/20" />
    </div>
  )
}
