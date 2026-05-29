import { NextRequest, NextResponse } from "next/server";
import { getMetObject, MET_EMOTIONAL_ARTWORKS } from "@/lib/api/met";
import { ARTWORKS } from "@/data/seed/artworks";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const emotionId = searchParams.get("emotion");
  const source = searchParams.get("source") ?? "seed";
  const id = searchParams.get("id");

  // Single Met object
  if (source === "met" && id) {
    const obj = await getMetObject(parseInt(id));
    if (!obj || !obj.isPublicDomain) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: obj });
  }

  // Seed data filtered by emotion
  if (emotionId) {
    const filtered = ARTWORKS.filter((a) => a.emotionResonance.includes(emotionId));
    return NextResponse.json({ data: filtered });
  }

  // Met artworks for emotion
  if (source === "met" && emotionId && MET_EMOTIONAL_ARTWORKS[emotionId]) {
    const ids = MET_EMOTIONAL_ARTWORKS[emotionId];
    const objects = await Promise.allSettled(ids.map((i) => getMetObject(i)));
    const data = objects
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof getMetObject>>> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);
    return NextResponse.json({ data });
  }

  return NextResponse.json({ data: ARTWORKS });
}
