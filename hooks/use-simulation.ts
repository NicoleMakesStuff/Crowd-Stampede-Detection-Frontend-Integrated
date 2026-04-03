"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export type SimulationMode = "normal" | "running" | "stampede"

export interface SimulationState {
  grid: Float32Array
  regionGrid: Float32Array
  totalEnergy: number
  maxPressure: number
  avgDensity: number
  criticalRegions: number
  alertCount: number
  timestamp: number
  // Camera simulation data
  cameraData: {
    personCount: number
    risk: number
    confidence: number
    status: string
  }
  // High-risk region grid numbers (0-99)
  highRiskRegions: Array<{ gridNumber: number; risk: number }>
}

const GRID_SIZE = 40
const REGION_SIZE = 10
const CELLS_PER_REGION = GRID_SIZE / REGION_SIZE // 4x4 cells per region

function createInitialGrid(): Float32Array {
  const grid = new Float32Array(GRID_SIZE * GRID_SIZE)
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() * 0.15
  }
  return grid
}

function computeRegionGrid(grid: Float32Array): Float32Array {
  const regions = new Float32Array(REGION_SIZE * REGION_SIZE)
  for (let ry = 0; ry < REGION_SIZE; ry++) {
    for (let rx = 0; rx < REGION_SIZE; rx++) {
      let sum = 0
      let count = 0
      for (let dy = 0; dy < CELLS_PER_REGION; dy++) {
        for (let dx = 0; dx < CELLS_PER_REGION; dx++) {
          const gx = rx * CELLS_PER_REGION + dx
          const gy = ry * CELLS_PER_REGION + dy
          if (gx < GRID_SIZE && gy < GRID_SIZE) {
            sum += grid[gy * GRID_SIZE + gx]
            count++
          }
        }
      }
      regions[ry * REGION_SIZE + rx] = count > 0 ? sum / count : 0
    }
  }
  return regions
}

function addGaussianHotspot(
  grid: Float32Array,
  cx: number,
  cy: number,
  radius: number,
  intensity: number
) {
  for (let y = Math.max(0, cy - radius); y < Math.min(GRID_SIZE, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x < Math.min(GRID_SIZE, cx + radius); x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (dist < radius) {
        const falloff = 1 - dist / radius
        const gaussian = Math.exp(-0.5 * (dist / (radius * 0.4)) ** 2)
        grid[y * GRID_SIZE + x] = Math.min(
          1,
          grid[y * GRID_SIZE + x] + intensity * gaussian * falloff
        )
      }
    }
  }
}

function simulateNormal(grid: Float32Array): Float32Array {
  const next = new Float32Array(grid.length)
  for (let i = 0; i < grid.length; i++) {
    const drift = (Math.random() - 0.5) * 0.04
    next[i] = Math.max(0, Math.min(1, grid[i] * 0.97 + drift + Math.random() * 0.02))
  }
  // Add small random hotspots
  if (Math.random() < 0.3) {
    const cx = Math.floor(Math.random() * GRID_SIZE)
    const cy = Math.floor(Math.random() * GRID_SIZE)
    addGaussianHotspot(next, cx, cy, 4, 0.2)
  }
  return next
}

function simulateRunning(grid: Float32Array, tick: number): Float32Array {
  const next = new Float32Array(grid.length)
  for (let i = 0; i < grid.length; i++) {
    const drift = (Math.random() - 0.5) * 0.03
    next[i] = Math.max(0, Math.min(1, grid[i] * 0.98 + drift + Math.random() * 0.015))
  }
  // Moving wave pattern - slower oscillation
  const waveCx = 10 + Math.sin(tick * 0.035) * 12
  const waveCy = 20 + Math.cos(tick * 0.028) * 10
  addGaussianHotspot(next, Math.round(waveCx), Math.round(waveCy), 7, 0.3)

  // Secondary hotspot - slower movement
  const cx2 = 30 + Math.cos(tick * 0.04) * 8
  const cy2 = 15 + Math.sin(tick * 0.05) * 12
  addGaussianHotspot(next, Math.round(cx2), Math.round(cy2), 5, 0.2)

  return next
}

function simulateStampede(grid: Float32Array, tick: number): Float32Array {
  const next = new Float32Array(grid.length)
  for (let i = 0; i < grid.length; i++) {
    const drift = (Math.random() - 0.5) * 0.04
    next[i] = Math.max(0, Math.min(1, grid[i] * 0.96 + drift + Math.random() * 0.025))
  }

  // Critical crush zone - slower drift
  const crushX = 20 + Math.sin(tick * 0.018) * 5
  const crushY = 20 + Math.cos(tick * 0.014) * 5
  addGaussianHotspot(next, Math.round(crushX), Math.round(crushY), 10, 0.55)

  // Multiple panic waves spreading - slower rotation and oscillation
  for (let w = 0; w < 3; w++) {
    const angle = (tick * 0.035 + w * 2.1)
    const dist = 8 + Math.sin(tick * 0.05 + w) * 5
    const wx = 20 + Math.cos(angle) * dist
    const wy = 20 + Math.sin(angle) * dist
    addGaussianHotspot(next, Math.round(wx), Math.round(wy), 6, 0.4)
  }

  // Bottleneck pressure buildup - slower pulsing
  addGaussianHotspot(next, 10, 35, 5, 0.35 + Math.sin(tick * 0.07) * 0.12)
  addGaussianHotspot(next, 35, 5, 4, 0.3 + Math.cos(tick * 0.06) * 0.1)

  return next
}

export function useSimulation() {
  const [mode, setMode] = useState<SimulationMode>("normal")
  const [isRunning, setIsRunning] = useState(true)
  const [state, setState] = useState<SimulationState>(() => {
    const grid = createInitialGrid()
    const regionGrid = computeRegionGrid(grid)
    return {
      grid,
      regionGrid,
      totalEnergy: 0,
      maxPressure: 0,
      avgDensity: 0,
      criticalRegions: 0,
      alertCount: 0,
      timestamp: Date.now(),
      cameraData: {
        personCount: 0,
        risk: 0,
        confidence: 1.0,
        status: "CLEAR",
      },
      highRiskRegions: [],
    }
  })

  const tickRef = useRef(0)
  const gridRef = useRef(state.grid)
  const modeRef = useRef(mode)
  const isRunningRef = useRef(isRunning)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  useEffect(() => {
    let animationId: number

    const step = () => {
      if (!isRunningRef.current) {
        animationId = requestAnimationFrame(step)
        return
      }

      tickRef.current++
      const currentMode = modeRef.current
      let nextGrid: Float32Array

      switch (currentMode) {
        case "running":
          nextGrid = simulateRunning(gridRef.current, tickRef.current)
          break
        case "stampede":
          nextGrid = simulateStampede(gridRef.current, tickRef.current)
          break
        default:
          nextGrid = simulateNormal(gridRef.current)
      }

      gridRef.current = nextGrid
      const regionGrid = computeRegionGrid(nextGrid)

      // Compute stats
      let totalEnergy = 0
      let maxPressure = 0
      for (let i = 0; i < nextGrid.length; i++) {
        totalEnergy += nextGrid[i]
        if (nextGrid[i] > maxPressure) maxPressure = nextGrid[i]
      }

      let criticalRegions = 0
      let avgDensity = 0
      for (let i = 0; i < regionGrid.length; i++) {
        avgDensity += regionGrid[i]
        if (regionGrid[i] > 0.6) criticalRegions++
      }
      avgDensity /= regionGrid.length

      const alertCount =
        currentMode === "stampede"
          ? criticalRegions + Math.floor(maxPressure * 5)
          : currentMode === "running"
            ? Math.floor(criticalRegions * 0.5)
            : 0

      // Simulate camera data - more realistic correlation with grid pressure
      // Count high-pressure cells as "people" - each cell with pressure > 0.3 represents a person
      let estimatedPeople = 0
      for (let i = 0; i < nextGrid.length; i++) {
        if (nextGrid[i] > 0.3) {
          estimatedPeople += Math.floor(nextGrid[i] * 2) // Higher pressure = more people in that spot
        }
      }
      // Add some variation based on mode
      if (currentMode === "stampede") {
        estimatedPeople = Math.floor(estimatedPeople * 1.5) + Math.floor(Math.random() * 10)
      } else if (currentMode === "running") {
        estimatedPeople = Math.floor(estimatedPeople * 1.2) + Math.floor(Math.random() * 5)
      } else {
        estimatedPeople = Math.floor(estimatedPeople * 0.8) + Math.floor(Math.random() * 3)
      }

      // Camera risk correlates with max pressure and critical regions
      const cameraRisk = Math.min(1.0, (maxPressure * 0.6) + (criticalRegions / 100) * 0.4)

      // Confidence drops when there's chaos (stampede mode or high pressure)
      const cameraConfidence = currentMode === "stampede"
        ? Math.max(0.5, 1.0 - (maxPressure * 0.3) - Math.random() * 0.2)
        : Math.max(0.7, 1.0 - (maxPressure * 0.1))

      // Find high-risk regions (> 0.6 pressure) and assign grid numbers (0-99)
      const highRiskRegions: Array<{ gridNumber: number; risk: number }> = []
      for (let ry = 0; ry < REGION_SIZE; ry++) {
        for (let rx = 0; rx < REGION_SIZE; rx++) {
          const risk = regionGrid[ry * REGION_SIZE + rx]
          if (risk > 0.6) {
            const gridNumber = ry * REGION_SIZE + rx // 0-99 sequential numbering
            highRiskRegions.push({ gridNumber, risk: Math.round(risk * 100) / 100 })
          }
        }
      }

      setState({
        grid: nextGrid,
        regionGrid,
        totalEnergy: Math.round(totalEnergy * 10) / 10,
        maxPressure: Math.round(maxPressure * 100) / 100,
        avgDensity: Math.round(avgDensity * 100) / 100,
        criticalRegions,
        alertCount,
        timestamp: Date.now(),
        cameraData: {
          personCount: estimatedPeople,
          risk: Math.round(cameraRisk * 100) / 100,
          confidence: Math.round(cameraConfidence * 100) / 100,
          status: cameraConfidence > 0.5 ? "CLEAR" : "BLOCKED",
        },
        highRiskRegions,
      })

      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationId)
  }, [])

  const reset = useCallback(() => {
    const grid = createInitialGrid()
    gridRef.current = grid
    tickRef.current = 0
    setState({
      grid,
      regionGrid: computeRegionGrid(grid),
      totalEnergy: 0,
      maxPressure: 0,
      avgDensity: 0,
      criticalRegions: 0,
      alertCount: 0,
      timestamp: Date.now(),
      cameraData: {
        personCount: 0,
        risk: 0,
        confidence: 1.0,
        status: "CLEAR",
      },
      highRiskRegions: [],
    })
  }, [])

  return {
    state,
    mode,
    setMode,
    isRunning,
    setIsRunning,
    reset,
  }
}
