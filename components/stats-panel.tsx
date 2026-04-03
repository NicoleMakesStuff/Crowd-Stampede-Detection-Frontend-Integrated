"use client"

import { Activity, Gauge, AlertTriangle, Zap, Grid3X3, ThermometerSun } from "lucide-react"
import type { SimulationState, SimulationMode } from "@/hooks/use-simulation"

interface StatsPanelProps {
  state: SimulationState
  mode: SimulationMode
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border/50 bg-card/60 p-4 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  )
}

function StatItem({
  icon: Icon,
  label,
  value,
  unit,
  color,
  critical,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  unit?: string
  color: string
  critical?: boolean
}) {
  return (
    <GlassCard className={critical ? "border-neon-red/40" : ""}>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${color}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p
            className={`font-mono text-lg font-bold leading-tight ${critical ? "text-neon-red" : "text-foreground"}`}
          >
            {value}
            {unit && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {unit}
              </span>
            )}
          </p>
        </div>
      </div>
    </GlassCard>
  )
}

export function StatsPanel({ state, mode }: StatsPanelProps) {
  const pressurePercent = Math.round(state.maxPressure * 100)
  const densityPercent = Math.round(state.avgDensity * 100)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Live Metrics</h2>
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${mode === "stampede"
              ? "animate-pulse-glow bg-neon-red"
              : mode === "running"
                ? "animate-pulse-glow bg-neon-amber"
                : "bg-neon-green"
              }`}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {mode.toUpperCase()}
          </span>
        </div>
      </div>

      <StatItem
        icon={Zap}
        label="Total Energy"
        value={state.totalEnergy.toFixed(1)}
        unit="kJ"
        color="bg-primary/15 text-primary"
      />

      <StatItem
        icon={Gauge}
        label="Max Pressure"
        value={pressurePercent}
        unit="%"
        color={
          pressurePercent > 75
            ? "bg-neon-red/15 text-neon-red"
            : pressurePercent > 50
              ? "bg-neon-amber/15 text-neon-amber"
              : "bg-neon-green/15 text-neon-green"
        }
        critical={pressurePercent > 75}
      />

      <StatItem
        icon={ThermometerSun}
        label="Avg Density"
        value={densityPercent}
        unit="%"
        color="bg-primary/15 text-primary"
      />

      <StatItem
        icon={Grid3X3}
        label="Critical Regions"
        value={state.criticalRegions}
        unit={`/ 100`}
        color={
          state.criticalRegions > 5
            ? "bg-neon-red/15 text-neon-red"
            : "bg-neon-green/15 text-neon-green"
        }
        critical={state.criticalRegions > 5}
      />

      <StatItem
        icon={AlertTriangle}
        label="Active Alerts"
        value={state.alertCount}
        color={
          state.alertCount > 0
            ? "bg-neon-red/15 text-neon-red"
            : "bg-muted text-muted-foreground"
        }
        critical={state.alertCount > 3}
      />

      {/* Camera Simulation Data */}
      <div className="flex items-center gap-2 px-1 pt-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Camera Simulation</h3>
      </div>

      <GlassCard>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">People Count</span>
            <span className="font-mono text-sm font-bold">{state.cameraData.personCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Camera Risk</span>
            <span className="font-mono text-sm font-bold">{Math.round(state.cameraData.risk * 100)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <span className="font-mono text-sm font-bold">{Math.round(state.cameraData.confidence * 100)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <span className={`font-mono text-sm font-bold ${state.cameraData.status === "CLEAR" ? "text-neon-green" : "text-neon-red"}`}>
              {state.cameraData.status}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* High-Risk Regions */}
      {state.highRiskRegions.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-1 pt-2">
            <AlertTriangle className="h-4 w-4 text-neon-red" />
            <h3 className="text-sm font-semibold text-foreground">High-Risk Grids</h3>
          </div>
          <GlassCard className="border-neon-red/40">
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {state.highRiskRegions.slice(0, 10).map((region, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">
                    Grid #{region.gridNumber}
                  </span>
                  <span className="font-mono font-bold text-neon-red">
                    {Math.round(region.risk * 100)}%
                  </span>
                </div>
              ))}
              {state.highRiskRegions.length > 10 && (
                <p className="pt-1 text-center text-xs text-muted-foreground">
                  +{state.highRiskRegions.length - 10} more
                </p>
              )}
            </div>
          </GlassCard>
        </>
      )}

      {/* Pressure bar */}
      <GlassCard>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          System Pressure
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pressurePercent}%`,
              background:
                pressurePercent > 75
                  ? "hsl(0, 72%, 55%)"
                  : pressurePercent > 50
                    ? "hsl(45, 90%, 60%)"
                    : "hsl(174, 72%, 52%)",
              boxShadow:
                pressurePercent > 75
                  ? "0 0 12px hsl(0, 72%, 55%)"
                  : pressurePercent > 50
                    ? "0 0 8px hsl(45, 90%, 60%)"
                    : "0 0 6px hsl(174, 72%, 52%)",
            }}
          />
        </div>
      </GlassCard>
    </div>
  )
}
