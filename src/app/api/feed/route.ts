import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchFeed } from "@/lib/providers";

const BodySchema = z.object({
  /** Preferred: profession ID (e.g. "product-manager") */
  profession: z.string().min(1).max(80).optional(),
  /** Legacy: granular interest strings */
  interests: z.array(z.string().min(1).max(80)).max(20).optional().default([]),
  contentTypes: z
    .array(z.enum(["News", "Videos", "Articles"]))
    .optional()
    .default(["News", "Videos", "Articles"]),
  /** Set to true from the Refresh button to bypass in-memory cache */
  bustCache: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profession, interests, contentTypes, bustCache } = BodySchema.parse(body);

    if (!profession && (!interests || interests.length === 0)) {
      return NextResponse.json(
        { error: "Either profession or interests must be provided" },
        { status: 400 },
      );
    }

    const stories = await fetchFeed({
      profession,
      interests: interests ?? [],
      contentTypes,
      bustCacheFlag: bustCache,
    });

    const videoCount = stories.filter((s) => s.content_type === "Videos").length;
    console.log(`[feed] profession=${profession} total=${stories.length} videos=${videoCount} types=${contentTypes.join(",")}`);

    return NextResponse.json({ count: stories.length, stories });
  } catch (err) {
    console.error("[/api/feed]", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: err.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}
