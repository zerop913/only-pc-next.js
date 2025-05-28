import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { clearFavorites } from "@/services/favoriteService";

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    let userId: number | undefined;

    if (token) {
      const decoded = verify(
        token,
        process.env.JWT_SECRET || "default_secret"
      ) as {
        userId: number;
      };
      userId = decoded.userId;
    }

    await clearFavorites(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear favorites error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
