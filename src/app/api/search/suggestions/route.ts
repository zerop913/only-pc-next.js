import { NextRequest, NextResponse } from "next/server";
import { generateSuggestions } from "@/services/suggestionService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const includeBuilds = searchParams.get("includeBuilds") === "true";

    if (query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await generateSuggestions(query, includeBuilds);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
