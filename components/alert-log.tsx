"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, ShieldAlert, Info } from "lucide-react"
import type { SimulationState, SimulationMode } from "@/hooks/use-simulation"

interface AlertEntry {
  id: number
  time: string
  message: string
  severity: "info" | "warning" | "critical"
}

interface AlertLogProps {
  state: SimulationState
  mode: SimulationMode
}

let alertId = 0

export function AlertLog({ state, mode }: AlertLogProps) {
  const [alerts, setAlerts] = useState<AlertEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCriticalRef = useRef(0)
  const prevModeRef = useRef(mode)

  useEffect(() => {
    const now = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    const newAlerts: AlertEntry[] = []

    if (prevModeRef.current !== mode) {
      newAlerts.push({
        id: ++alertId,
        time: now,
        message: `Simulation mode changed to ${mode.toUpperCase()}`,
        severity: mode === "stampede" ? "critical" : mode === "running" ? "warning" : "info",
      })
      prevModeRef.current = mode
    }

    if (state.criticalRegions > prevCriticalRef.current && state.criticalRegions > 3) {
      newAlerts.push({
        id: ++alertId,
        time: now,
        message: `${state.criticalRegions} critical regions detected - pressure exceeding thresholds`,
        severity: "critical",
      })
    }

    if (state.maxPressure > 0.85 && Math.random() < 0.15) {
      newAlerts.push({
        id: ++alertId,
        time: now,
        message: `Extreme pressure spike: ${Math.round(state.maxPressure * 100)}% - evacuation recommended`,
        severity: "critical",
      })
    }

    if (state.maxPressure > 0.5 && state.maxPressure <= 0.85 && Math.random() < 0.08) {
      newAlerts.push({
        id: ++alertId,
        time: now,
        message: `Elevated pressure in sector - monitoring active`,
        severity: "warning",
      })
    }

    prevCriticalRef.current = state.criticalRegions

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...prev, ...newAlerts].slice(-50))
    }
  }, [state.criticalRegions, state.maxPressure, mode, state.timestamp])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [alerts])

  const SeverityIcon = ({ severity }: { severity: AlertEntry["severity"] }) => {
    switch (severity) {
      case "critical":
        return <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-neon-red" />
      case "warning":
        return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-neon-amber" />
      default:
        return <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Alert Log</h2>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {alerts.length} events
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex max-h-[240px] flex-col gap-1 overflow-y-auto rounded-lg border border-border/50 bg-card/60 p-2 backdrop-blur-md"
      >
        {alerts.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No alerts yet. Start the simulation to generate events.
          </p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs ${
                alert.severity === "critical"
                  ? "bg-neon-red/5"
                  : alert.severity === "warning"
                    ? "bg-neon-amber/5"
                    : "bg-transparent"
              }`}
            >
              <SeverityIcon severity={alert.severity} />
              <span className="shrink-0 font-mono text-muted-foreground">
                {alert.time}
              </span>
              <span
                className={
                  alert.severity === "critical"
                    ? "text-neon-red"
                    : alert.severity === "warning"
                      ? "text-neon-amber"
                      : "text-foreground/80"
                }
              >
                {alert.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
