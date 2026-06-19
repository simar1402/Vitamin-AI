import { NextResponse } from "next/server";
import { z } from "zod";
import type { FeedStory } from "@/lib/client-rss";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/integrations/supabase/types";

const StorySchema = z.object({
  id: z.string().min(1),
  headline: z.string(),
  summary: z.string(),
  image_url: z.string().nullable(),
  source_url: z.string().min(1),
  source_name: z.string(),
  published_at: z.string(),
  content_type: z.enum(["News", "Videos", "Articles"]),
  category: z.string(),
});

const BookmarkSchema = z.object({
  story: StorySchema,
  saved: z.boolean(),
});

function storyToRow(story: FeedStory): TablesInsert<"stories"> {
  return {
    id: story.id,
    headline: story.headline,
    summary: story.summary ?? "",
    image_url: story.image_url,
    source_url: story.source_url,
    source_name: story.source_name ?? null,
    published_at: story.published_at,
    content_type: story.content_type,
    category: story.category ?? "",
    tags: [],
    why_it_matters: null,
  };
}

function rowToFeedStory(row: {
  id: string;
  headline: string;
  summary: string;
  image_url: string | null;
  source_url: string;
  source_name: string | null;
  published_at: string;
  content_type: string;
  category: string;
}): FeedStory {
  return {
    id: row.id,
    headline: row.headline,
    summary: row.summary,
    image_url: row.image_url,
    source_url: row.source_url,
    source_name: row.source_name ?? "Web",
    published_at: row.published_at,
    content_type: row.content_type as FeedStory["content_type"],
    category: row.category,
    why_it_matters: null,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_stories")
    .select(
      "story_id, stories(id, headline, summary, image_url, source_url, source_name, published_at, content_type, category)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/user/bookmarks GET]", error.message);
    return NextResponse.json({ error: "Failed to load bookmarks" }, { status: 500 });
  }

  const bookmarks = (data ?? [])
    .map((row) => {
      const story = row.stories as unknown as {
        id: string;
        headline: string;
        summary: string;
        image_url: string | null;
        source_url: string;
        source_name: string | null;
        published_at: string;
        content_type: string;
        category: string;
      } | null;
      return story ? rowToFeedStory(story) : null;
    })
    .filter((s): s is FeedStory => s !== null);

  return NextResponse.json({ bookmarks });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bookmark payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { story: rawStory, saved } = parsed.data;
  const story: FeedStory = { ...rawStory, why_it_matters: null };

  if (saved) {
    const { error: storyError } = await supabase
      .from("stories")
      .upsert(storyToRow(story), { onConflict: "id" });

    if (storyError) {
      console.error("[api/user/bookmarks POST] story upsert:", storyError.message);
      return NextResponse.json({ error: "Failed to save story" }, { status: 500 });
    }

    const { error } = await supabase.from("saved_stories").insert({
      user_id: user.id,
      story_id: story.id,
    });

    if (error && error.code !== "23505") {
      console.error("[api/user/bookmarks POST] insert:", error.message);
      return NextResponse.json({ error: "Failed to save bookmark" }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("saved_stories")
      .delete()
      .eq("user_id", user.id)
      .eq("story_id", story.id);

    if (error) {
      console.error("[api/user/bookmarks POST] delete:", error.message);
      return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
