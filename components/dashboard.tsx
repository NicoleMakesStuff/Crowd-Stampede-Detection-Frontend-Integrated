"use client"

import { useState } from "react"
import { useSimulation } from "@/hooks/use-simulation"
import { FloorGrid } from "@/components/floor-grid"
import { StatsPanel } from "@/components/stats-panel"
import { AlertLog } from "@/components/alert-log"
import { ControlSidebar } from "@/components/control-sidebar"
import { Shield, Radio } from "lucide-react"

export function Dashboard() {
  const { state, mode, setMode, isRunning, setIsRunning, reset } = useSimulation()
  const [showOverlay, setShowOverlay] = useState(true)

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="shrink-0 border-b border-border/50 bg-card/40 p-5 backdrop-blur-md lg:w-[260px] lg:border-b-0 lg:border-r">
        <ControlSidebar
          mode={mode}
          setMode={setMode}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          reset={reset}
          showOverlay={showOverlay}
          setShowOverlay={setShowOverlay}
        />
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-5 overflow-hidden p-5">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                Grid Visualization
              </h1>
              <p className="text-xs text-muted-foreground">
                40 x 40 Sensor Array with 10 x 10 Region Overlay
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/60 px-3 py-1.5 backdrop-blur-md">
            <Radio
              className={`h-3.5 w-3.5 ${
                isRunning
                  ? mode === "stampede"
                    ? "animate-pulse-glow text-neon-red"
                    : "animate-pulse-glow text-neon-green"
                  : "text-muted-foreground"
              }`}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {isRunning ? "LIVE" : "PAUSED"}
            </span>
          </div>
        </header>

        {/* Grid + Stats */}
        <div className="flex flex-1 flex-col gap-5 xl:flex-row">
          {/* Grid Area */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <FloorGrid
              grid={state.grid}
              showRegionOverlay={showOverlay}
              regionGrid={state.regionGrid}
            />
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {`Sensors: 1,600`} | Regions: 100 | Tick:{" "}
              {new Date(state.timestamp).toLocaleTimeString("en-US", {
                hour12: false,
              })}
            </p>
          </div>

          {/* Right Panels */}
          <div className="flex w-full flex-col gap-5 xl:w-[280px]">
            <StatsPanel state={state} mode={mode} />
            <AlertLog state={state} mode={mode} />
          </div>
        </div>
      </main>
    </div>
  )
}
