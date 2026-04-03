import { NextResponse } from "next/server"

// ⚠️ Make sure this matches your Flask port
const FLASK_API_URL = "http://127.0.0.1:5001/api/fusion_stats"

export async function GET() {
  try {
    const res = await fetch(FLASK_API_URL, {
      signal: AbortSignal.timeout(2000), // Don't hang if Python is down
      cache: "no-store"
    })

    if (!res.ok) {
      throw new Error(`Flask returned ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Backend Unreachable" }, 
      { status: 503 }
    )
  }
}