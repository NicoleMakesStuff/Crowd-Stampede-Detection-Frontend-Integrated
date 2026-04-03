"use client"

import { useState } from "react"
import { Shield, Grid3X3, Video } from "lucide-react"
import { Dashboard } from "@/components/dashboard"
import { LiveMonitor } from "@/components/live-monitor"

type Page = "simulation" | "live-monitor"

export function AppShell() {
  const [currentPage, setCurrentPage] = useState<Page>("simulation")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation bar */}
      <nav className="flex items-center justify-between border-b border-border/50 bg-card/40 px-5 py-3 backdrop-blur-md">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Crowd Pulse
          </span>
        </div>

        {/* Page toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-background/60 p-1 backdrop-blur-md">
          <button
            onClick={() => setCurrentPage("simulation")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 font-mono text-xs font-medium transition-colors ${currentPage === "simulation"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
              }`}
            aria-current={currentPage === "simulation" ? "page" : undefined}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>Simulation</span>
          </button>
          <button
            onClick={() => setCurrentPage("live-monitor")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 font-mono text-xs font-medium transition-colors ${currentPage === "live-monitor"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
              }`}
            aria-current={currentPage === "live-monitor" ? "page" : undefined}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Live Monitor</span>
          </button>
        </div>

        {/* Spacer for balance */}
        <div className="w-[120px]" />
      </nav>

      {/* Page content */}
      {currentPage === "simulation" ? <Dashboard /> : <LiveMonitor />}
    </div>
  )
}
