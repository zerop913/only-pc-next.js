import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { mergeFavorites } from "@/services/favoriteService";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as {
      userId: number;
    };
    const { temporaryIds } = await request.json();

    await mergeFavorites(decoded.userId, temporaryIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Merge favorites error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
