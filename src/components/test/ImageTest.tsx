"use client";

// Тестовый файл для проверки работы imageUtils
import { getImageUrl, getCloudinaryImageUrl } from "@/lib/utils/imageUtils";

console.log("=== Тестирование imageUtils ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);

const testImagePath = "/images/videokarty/nvidia-geforce-rtx-4090.jpg";

console.log("Исходный путь:", testImagePath);
console.log("getImageUrl результат:", getImageUrl(testImagePath));
console.log(
  "getCloudinaryImageUrl результат:",
  getCloudinaryImageUrl(testImagePath)
);

export default function ImageTest() {
  // Принудительно тестируем Cloudinary URL
  const forceCloudinaryUrl = getCloudinaryImageUrl(testImagePath);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Тест изображений</h2>
      <p>
        <strong>Режим:</strong> {process.env.NODE_ENV}
      </p>
      <p>
        <strong>Исходный путь:</strong> {testImagePath}
      </p>
      <p>
        <strong>getImageUrl (авто):</strong> {getImageUrl(testImagePath)}
      </p>
      <p>
        <strong>getCloudinaryImageUrl (принудительно):</strong>{" "}
        {getCloudinaryImageUrl(testImagePath)}
      </p>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div>
          <h3>Локальное изображение (development)</h3>
          <img
            src={getImageUrl(testImagePath)}
            alt="Локальный тест"
            style={{ maxWidth: "200px", border: "1px solid blue" }}
            onError={(e) =>
              console.log("Ошибка загрузки локального изображения:", e)
            }
            onLoad={() =>
              console.log("Локальное изображение загружено успешно")
            }
          />
        </div>

        <div>
          <h3>Cloudinary изображение (принудительно)</h3>
          <img
            src={forceCloudinaryUrl}
            alt="Cloudinary тест"
            style={{ maxWidth: "200px", border: "1px solid red" }}
            onError={(e) =>
              console.log("Ошибка загрузки Cloudinary изображения:", e)
            }
            onLoad={() =>
              console.log("Cloudinary изображение загружено успешно")
            }
          />
        </div>
      </div>
    </div>
  );
}
