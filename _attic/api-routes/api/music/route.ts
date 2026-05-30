import { NextRequest, NextResponse } from "next/server";
import { TRACKS } from "@/data/seed/music";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const emotionId = searchParams.get("emotion");
  const mood = searchParams.get("mood");

  if (emotionId) {
    const filtered = TRACKS.filter((t) => t.emotionResonance.includes(emotionId));
    return NextResponse.json({ data: filtered });
  }

  if (mood) {
    const filtered = TRACKS.filter((t) => t.moods.includes(mood));
    return NextResponse.json({ data: filtered });
  }

  return NextResponse.json({ data: TRACKS });
}

// Future: Last.fm integration when API key is provided
// GET /api/music?lastfm=true&tag={mood} → fetch real track metadata
