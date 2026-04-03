"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Video,
  Users,
  Gauge,
  AlertTriangle,
  Wifi,
  WifiOff,
  Activity,
  Eye,
  Weight,
  Ruler,
  Zap,
  Move,
  Thermometer,
} from "lucide-react"

// --------------- types matching Flask /api/fusion_stats ---------------

interface CameraState {
  person_count: number
  risk: number
  confidence: number
  status: string
  last_update: number
}

interface PiezoRawData {
  D: number
  V: number
  IR: number
  PIR: number
  P1: number
  P2: number
  P3: number
  P4: number
  P5: number
}

interface PiezoState {
  risk: number
  raw_data: PiezoRawData
}

interface FusionState {
  total_risk: number
  status: "SAFE" | "WARNING" | "CRITICAL"
  weights: { cam: number; piezo: number }
}

interface FusionStats {
  camera: CameraState
  piezo: PiezoState
  fusion: FusionState
}

const DEFAULT_STATS: FusionStats = {
  camera: { person_count: 0, risk: 0, confidence: 1, status: "CLEAR", last_update: 0 },
  piezo: {
    risk: 0,
    raw_data: { D: 0, V: 0, IR: 0, PIR: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 },
  },
  fusion: { total_risk: 0, status: "SAFE", weights: { cam: 0.6, piezo: 0.4 } },
}

// --------------- shared glass card ---------------

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

// --------------- status helpers ---------------

type FusionStatus = "SAFE" | "WARNING" | "CRITICAL" | "disconnected"

function statusColor(status: FusionStatus) {
  switch (status) {
    case "CRITICAL":
      return "text-neon-red"
    case "WARNING":
      return "text-neon-amber"
    case "SAFE":
      return "text-neon-green"
    default:
      return "text-muted-foreground"
  }
}

function statusBg(status: FusionStatus) {
  switch (status) {
    case "CRITICAL":
      return "bg-neon-red/15 border-neon-red/40"
    case "WARNING":
      return "bg-neon-amber/15 border-neon-amber/40"
    case "SAFE":
      return "bg-neon-green/15 border-neon-green/40"
    default:
      return "bg-muted/30 border-border/50"
  }
}

function statusGlow(status: FusionStatus) {
  switch (status) {
    case "CRITICAL":
      return "0 0 20px hsl(0, 72%, 55% / 0.3)"
    case "WARNING":
      return "0 0 16px hsl(45, 90%, 60% / 0.2)"
    case "SAFE":
      return "0 0 12px hsl(174, 72%, 52% / 0.15)"
    default:
      return "none"
  }
}

function riskBarColor(score: number) {
  if (score > 70) return "hsl(0, 72%, 55%)"
  if (score > 40) return "hsl(45, 90%, 60%)"
  return "hsl(174, 72%, 52%)"
}

function riskBarGlow(score: number) {
  if (score > 70) return "0 0 12px hsl(0, 72%, 55%)"
  if (score > 40) return "0 0 8px hsl(45, 90%, 60%)"
  return "0 0 6px hsl(174, 72%, 52%)"
}

function statusLabel(status: FusionStatus) {
  switch (status) {
    case "CRITICAL":
      return "STAMPEDE"
    case "WARNING":
      return "WARNING"
    case "SAFE":
      return "SAFE"
    default:
      return "N/A"
  }
}

// --------------- fusion stats hook ---------------

function useFusionStats() {
  const [stats, setStats] = useState<FusionStats>(DEFAULT_STATS)
  const [connected, setConnected] = useState(false)

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/fusion_stats")
      const json = await res.json()
      if (res.ok && !json.error) {
        setStats({
          camera: json.camera ?? DEFAULT_STATS.camera,
          piezo: {
            ...DEFAULT_STATS.piezo,
            ...(json.piezo || {}),
            raw_data: json.piezo?.raw_data ?? DEFAULT_STATS.piezo.raw_data,
          },
          fusion: json.fusion ?? DEFAULT_STATS.fusion,
        })
        setConnected(true)
      } else {
        setConnected(false)
      }
    } catch {
      setConnected(false)
    }
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [poll])

  return { stats, connected }
}

// --------------- sub-components ---------------

function VideoFeedPanel({ fusionStatus }: { fusionStatus: FusionStatus }) {
  // const FLASK_URL = "http://127.0.0.1:5001/" // Removed trailing slash to prevent double slashes
  const [imgError, setImgError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // 1. Start with an empty string to avoid hydration mismatch
  const [imgSrc, setImgSrc] = useState("")

  useEffect(() => {
    // 2. Set the initial image source only after the component mounts on the client
    setImgSrc(`/latest_image?t=${Date.now()}`)

    const id = setInterval(() => {
      setImgSrc(`/latest_image?t=${Date.now()}`)
      setImgError(false)
    }, 1000)

    return () => clearInterval(id)
  }, []) // Removed FLASK_URL dependency

  return (
    <GlassCard className={`${statusBg(fusionStatus)}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Camera Feed</h3>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs ${imgError
            ? "border-border/50 bg-muted/40 text-muted-foreground"
            : "border-neon-red/40 bg-neon-red/10 text-neon-red"
            }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${imgError ? "bg-muted-foreground" : "animate-pulse-glow bg-neon-red"
              }`}
          />
          {imgError ? "OFFLINE" : "LIVE"}
        </span>
      </div>

      <div
        className="relative aspect-video w-full overflow-hidden rounded-md border border-border/30 bg-background/80"
        style={{ boxShadow: statusGlow(fusionStatus) }}
      >
        {/* 3. Check for imgSrc presence to prevent broken image icons on first frame */}
        {imgError || !imgSrc ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <WifiOff className="h-8 w-8" />
            <p className="text-xs">{!imgSrc ? "Initializing..." : "Camera feed unavailable"}</p>
            <p className="text-xs">Waiting for Flask...</p>
          </div>
        ) : (
          <img
            ref={imgRef}
            src={imgSrc}
            alt="Live YOLO camera feed showing crowd detection with bounding boxes"
            className="h-full w-full object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>
    </GlassCard>
  )
}

function FusionStatusPanel({
  stats,
  connected,
}: {
  stats: FusionStats
  connected: boolean
}) {
  const fusionStatus: FusionStatus = connected ? stats.fusion.status : "disconnected"
  const riskPct = Math.round(stats.fusion.total_risk * 100)
  const camRiskPct = Math.round(stats.camera.risk * 100)
  const piezoRiskPct = Math.round(stats.piezo.risk * 100)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Fusion Status</h3>
        <div className="ml-auto flex items-center gap-1.5">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 text-neon-green" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="font-mono text-xs text-muted-foreground">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Threat level badge */}
      <GlassCard className={statusBg(fusionStatus)}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${statusBg(fusionStatus)}`}
          >
            <AlertTriangle className={`h-5 w-5 ${statusColor(fusionStatus)}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Threat Level
            </p>
            <p
              className={`font-mono text-xl font-bold uppercase leading-tight ${statusColor(fusionStatus)}`}
            >
              {statusLabel(fusionStatus)}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Head count */}
      <GlassCard>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Head Count
            </p>
            <p className="font-mono text-lg font-bold leading-tight text-foreground">
              {stats.camera.person_count}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                detected
              </span>
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Camera confidence */}
      <GlassCard>
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${stats.camera.status === "CLEAR" ? "bg-neon-green/15 text-neon-green" : "bg-neon-red/15 text-neon-red"
            }`}>
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Camera Visibility
            </p>
            <p className={`font-mono text-lg font-bold leading-tight ${stats.camera.status === "CLEAR" ? "text-neon-green" : "text-neon-red"
              }`}>
              {stats.camera.status}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Fusion risk score bar */}
      <GlassCard>
        <div className="mb-1 flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${riskPct > 70
              ? "bg-neon-red/15 text-neon-red"
              : riskPct > 40
                ? "bg-neon-amber/15 text-neon-amber"
                : "bg-neon-green/15 text-neon-green"
              }`}
          >
            <Gauge className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              Fusion Risk
            </p>
            <p className="font-mono text-lg font-bold leading-tight text-foreground">
              {riskPct}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                / 100
              </span>
            </p>
          </div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${riskPct}%`,
              background: riskBarColor(riskPct),
              boxShadow: riskBarGlow(riskPct),
            }}
          />
        </div>
      </GlassCard>

      {/* Camera vs Piezo risk breakdown */}
      <GlassCard>
        <p className="mb-3 text-xs font-semibold text-foreground">Risk Breakdown</p>
        <div className="flex flex-col gap-3">
          {/* Camera risk */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" /> Camera
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  (w: {stats.fusion.weights.cam})
                </span>
              </span>
              <span className="font-mono text-xs font-semibold text-foreground">{camRiskPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${camRiskPct}%`,
                  background: riskBarColor(camRiskPct),
                  boxShadow: riskBarGlow(camRiskPct),
                }}
              />
            </div>
          </div>
          {/* Piezo risk */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" /> Piezo
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  (w: {stats.fusion.weights.piezo})
                </span>
              </span>
              <span className="font-mono text-xs font-semibold text-foreground">{piezoRiskPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${piezoRiskPct}%`,
                  background: riskBarColor(piezoRiskPct),
                  boxShadow: riskBarGlow(piezoRiskPct),
                }}
              />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function PiezoSensorPanel({ rawData, risk }: { rawData: PiezoRawData; risk: number }) {
  const riskPct = Math.round(risk * 100)
  const color = riskPct > 70 ? "neon-red" : riskPct > 40 ? "neon-amber" : "neon-green"

  const sensors = [
    { label: "P1", value: rawData.P1 },
    { label: "P2", value: rawData.P2 },
    { label: "P3", value: rawData.P3 },
    { label: "P4", value: rawData.P4 },
    { label: "P5", value: rawData.P5 },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Weight className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Piezo Sensor
        </h3>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          LIVE READING
        </span>
      </div>

      <GlassCard className={riskPct > 70 ? "border-neon-red/40" : ""}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Risk Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`font-mono text-2xl font-bold leading-tight text-${color}`}>
                {riskPct}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground">Vibration Mock</p>
            <span className={`font-mono text-xl font-bold ${rawData.V ? "text-neon-red" : "text-muted-foreground"}`}>
              {rawData.V ? "DETECTED" : "None"}
            </span>
          </div>
        </div>

        {/* Risk Bar */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${riskPct}%`,
              background: `hsl(var(--${color}))`,
              boxShadow: `0 0 8px hsl(var(--${color}))`,
            }}
          />
        </div>

        {/* Detailed Piezo Values */}
        <div className="mt-4 grid grid-cols-5 gap-1">
          {sensors.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <div className="relative h-16 w-full rounded-sm bg-secondary/50 overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-primary/60 transition-all duration-300"
                  style={{ height: `${Math.min((s.value / 5.0) * 100, 100)}%` }} // Assuming 5V max?
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{s.label}</span>
              <span className="text-[10px] font-mono font-bold">{s.value.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Environmental Data Row */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded bg-secondary/30 p-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Ruler className="h-3 w-3" /> Distance
            </div>
            <div className="mt-1 font-mono text-sm font-semibold">
              {rawData.D.toFixed(1)} cm
            </div>
          </div>
          <div className="rounded bg-secondary/30 p-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Move className="h-3 w-3" /> Motion
            </div>
            <div className="mt-1 flex gap-2 font-mono text-[10px] uppercase">
              <span className={rawData.PIR ? "text-neon-red font-bold" : "text-muted-foreground"}>PIR</span>
              <span className={rawData.IR ? "text-neon-red font-bold" : "text-muted-foreground"}>IR</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

// --------------- main component ---------------

export function LiveMonitor() {
  const { stats, connected } = useFusionStats()
  const fusionStatus: FusionStatus = connected ? stats.fusion.status : "disconnected"

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Single Tile Monitor
            </h1>
            <p className="text-xs text-muted-foreground">
              YOLO Head Detection + Piezo Fusion
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/60 px-3 py-1.5 backdrop-blur-md">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 animate-pulse-glow text-neon-green" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="font-mono text-xs text-muted-foreground">
            {connected ? "FLASK ONLINE" : "FLASK OFFLINE"}
          </span>
        </div>
      </header>

      {/* Content: Video + Panels */}
      <div className="flex flex-1 flex-col gap-5 xl:flex-row">
        {/* Left: video feed */}
        <div className="flex flex-1 flex-col gap-5">
          <VideoFeedPanel fusionStatus={fusionStatus} />
        </div>

        {/* Right: fusion status + piezo */}
        <div className="flex w-full flex-col gap-5 overflow-auto xl:w-[320px]">
          <FusionStatusPanel stats={stats} connected={connected} />
          <PiezoSensorPanel rawData={stats.piezo.raw_data} risk={stats.piezo.risk} />
        </div>
      </div>
    </div>
  )
}