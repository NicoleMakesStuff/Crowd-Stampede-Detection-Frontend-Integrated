"use client"

import {
  Play,
  Pause,
  RotateCcw,
  Users,
  Footprints,
  ShieldAlert,
  Eye,
  EyeOff,
  Shield,
  ExternalLink,
} from "lucide-react"
import type { SimulationMode } from "@/hooks/use-simulation"

interface ControlSidebarProps {
  mode: SimulationMode
  setMode: (mode: SimulationMode) => void
  isRunning: boolean
  setIsRunning: (running: boolean) => void
  reset: () => void
  showOverlay: boolean
  setShowOverlay: (show: boolean) => void
}

function GlassButton({
  children,
  onClick,
  active = false,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  variant?: "default" | "danger" | "success"
  className?: string
}) {
  const baseStyles =
    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full"

  const variantStyles = active
    ? variant === "danger"
      ? "border-neon-red/40 bg-neon-red/15 text-neon-red shadow-[0_0_12px_hsl(0,72%,55%,0.15)]"
      : variant === "success"
        ? "border-neon-green/40 bg-neon-green/15 text-neon-green shadow-[0_0_12px_hsl(140,60%,50%,0.15)]"
        : "border-primary/40 bg-primary/15 text-primary shadow-[0_0_12px_hsl(174,72%,52%,0.15)]"
    : "border-border/50 bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground backdrop-blur-md"

  return (
    <button onClick={onClick} className={`${baseStyles} ${variantStyles} ${className}`}>
      {children}
    </button>
  )
}

export function ControlSidebar({
  mode,
  setMode,
  isRunning,
  setIsRunning,
  reset,
  showOverlay,
  setShowOverlay,
}: ControlSidebarProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Logo / Header */}
      <div className="flex items-center gap-2.5 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground">
            Crowd Pulse
          </h1>
          <p className="text-xs text-muted-foreground">Sensor Grid Monitor</p>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* Simulation Mode */}
      <div className="flex flex-col gap-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Simulation Mode
        </p>
        <GlassButton
          onClick={() => setMode("normal")}
          active={mode === "normal"}
          variant="success"
        >
          <Users className="h-4 w-4" />
          Normal
        </GlassButton>
        <GlassButton
          onClick={() => setMode("running")}
          active={mode === "running"}
        >
          <Footprints className="h-4 w-4" />
          Running
        </GlassButton>
        <GlassButton
          onClick={() => setMode("stampede")}
          active={mode === "stampede"}
          variant="danger"
        >
          <ShieldAlert className="h-4 w-4" />
          Stampede
        </GlassButton>
        <GlassButton
          onClick={() => window.open("http://localhost:3005", "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
          SJT Sim
        </GlassButton>
      </div>

      <div className="h-px bg-border/50" />

      {/* Playback Controls */}
      <div className="flex flex-col gap-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Playback
        </p>
        <div className="flex gap-2">
          <GlassButton
            onClick={() => setIsRunning(!isRunning)}
            active={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? "Pause" : "Play"}
          </GlassButton>
          <GlassButton onClick={reset} className="flex-1">
            <RotateCcw className="h-4 w-4" />
            Reset
          </GlassButton>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* Display Options */}
      <div className="flex flex-col gap-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Display
        </p>
        <GlassButton
          onClick={() => setShowOverlay(!showOverlay)}
          active={showOverlay}
        >
          {showOverlay ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          Region Overlay
        </GlassButton>
      </div>

      {/* Legend */}
      <div className="mt-auto flex flex-col gap-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pressure Scale
        </p>
        <div className="overflow-hidden rounded-lg border border-border/50 bg-card/60 p-3 backdrop-blur-md">
          <div
            className="mb-2 h-3 rounded-full"
            style={{
              background:
                "linear-gradient(to right, hsl(174, 60%, 30%), hsl(140, 60%, 50%), hsl(45, 90%, 60%), hsl(20, 80%, 50%), hsl(0, 72%, 55%))",
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>Medium</span>
            <span>Critical</span>
          </div>
        </div>
      </div>
    </div>
  )
}
