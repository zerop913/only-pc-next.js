import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

// Middleware для генерации QR-кода на лету
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");

    if (!data) {
      return new NextResponse("Missing required 'data' parameter", {
        status: 400,
      });
    }

    // Генерируем QR-код
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 400,
    });

    // Декодируем base64 строку
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Возвращаем изображение
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Ошибка при генерации QR-кода:", error);
    return new NextResponse("Error generating QR code", { status: 500 });
  }
}
