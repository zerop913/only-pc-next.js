import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const { id } = await Promise.resolve(params);
    const isOnline = await redis.exists(`user:${id}:online`);
    return NextResponse.json({ isOnline: Boolean(isOnline) });
  } catch (error) {
    console.error("Error checking online status:", error);
    return NextResponse.json({ isOnline: false });
  }
}
