import { NextRequest, NextResponse } from "next/server";
import { FILMS } from "@/data/seed/films";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const emotionId = searchParams.get("emotion");

  if (emotionId) {
    const filtered = FILMS.filter((f) => f.emotionResonance.includes(emotionId));
    return NextResponse.json({ data: filtered });
  }

  return NextResponse.json({ data: FILMS });
}

// Future: TMDB integration when API key is provided
// POST /api/films { tmdbId: number } → fetch and cache film data
