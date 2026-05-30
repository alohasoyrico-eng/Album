import { NextRequest, NextResponse } from "next/server";
import { getPoemsByAuthor, POETRYDB_POEMS } from "@/lib/api/poetrydb";
import { POEMS } from "@/data/seed/poetry";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const emotionId = searchParams.get("emotion");
  const author = searchParams.get("author");
  const source = searchParams.get("source") ?? "seed";

  // Live fetch by author
  if (source === "poetrydb" && author) {
    const poems = await getPoemsByAuthor(author, 5);
    return NextResponse.json({ data: poems });
  }

  // Seed data by emotion
  if (emotionId) {
    const filtered = POEMS.filter((p) => p.emotionResonance.includes(emotionId));
    return NextResponse.json({ data: filtered });
  }

  // Suggest PoetryDB poems for emotion
  if (emotionId && POETRYDB_POEMS[emotionId]) {
    const seeds = POETRYDB_POEMS[emotionId];
    const results = await Promise.allSettled(
      seeds.map((s) => getPoemsByAuthor(s.author, 1))
    );
    const poems = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
    return NextResponse.json({ data: poems });
  }

  return NextResponse.json({ data: POEMS });
}
