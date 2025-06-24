const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Настройка Cloudinary
cloudinary.config({
  cloud_name: "donvdhjbe",
  api_key: "558335862182769",
  api_secret: "JxzGoADiIScnF9KBkCMnNx0kXvU",
});

// Пути
const imagesDir = path.join(__dirname, "../public/images");
const logFile = path.join(__dirname, "upload-log.json");

// Загрузка существующих логов
let uploadLog = {};
if (fs.existsSync(logFile)) {
  uploadLog = JSON.parse(fs.readFileSync(logFile, "utf8"));
}

// Функция для получения всех изображений рекурсивно
function getAllImages(dir, baseDir = imagesDir) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllImages(filePath, baseDir));
    } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
      // Получаем относительный путь от папки images
      const relativePath = path.relative(baseDir, filePath);
      const publicPath = `/images/${relativePath.replace(/\\/g, "/")}`;

      results.push({
        localPath: filePath,
        relativePath: relativePath,
        publicPath: publicPath,
        fileName: file,
      });
    }
  }

  return results;
}

// Функция загрузки одного файла
async function uploadImage(imageInfo) {
  try {
    // Создаем public_id сохраняя структуру папок
    const folderPath = path.dirname(imageInfo.relativePath).replace(/\\/g, "/");
    const fileName = path.basename(
      imageInfo.fileName,
      path.extname(imageInfo.fileName)
    );
    const public_id =
      folderPath === "." ? fileName : `${folderPath}/${fileName}`;

    console.log(`Загружаю: ${imageInfo.publicPath} -> ${public_id}`);

    const result = await cloudinary.uploader.upload(imageInfo.localPath, {
      public_id: public_id,
      folder: "onlypc-images",
      resource_type: "image",
      overwrite: true,
      quality: "auto",
      fetch_format: "auto",
    });

    // Сохраняем информацию о загрузке
    uploadLog[imageInfo.publicPath] = {
      cloudinary_url: result.secure_url,
      public_id: result.public_id,
      uploaded_at: new Date().toISOString(),
      original_size: fs.statSync(imageInfo.localPath).size,
      cloudinary_size: result.bytes,
    };

    console.log(`✅ Успешно: ${imageInfo.publicPath}`);
    return result;
  } catch (error) {
    console.error(
      `❌ Ошибка при загрузке ${imageInfo.publicPath}:`,
      error.message
    );
    return null;
  }
}

// Основная функция
async function uploadAllImages() {
  console.log("🚀 Начинаю загрузку изображений в Cloudinary...\n");

  const images = getAllImages(imagesDir);
  console.log(`Найдено ${images.length} изображений\n`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < images.length; i++) {
    const imageInfo = images[i];

    // Пропускаем уже загруженные файлы
    if (uploadLog[imageInfo.publicPath]) {
      console.log(`⏭️  Пропускаю (уже загружен): ${imageInfo.publicPath}`);
      skipped++;
      continue;
    }

    const result = await uploadImage(imageInfo);

    if (result) {
      uploaded++;
    } else {
      errors++;
    }

    // Сохраняем лог каждые 10 файлов
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(logFile, JSON.stringify(uploadLog, null, 2));
      console.log(`\n📄 Прогресс: ${i + 1}/${images.length}\n`);
    }

    // Небольшая пауза чтобы не перегружать API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Финальное сохранение лога
  fs.writeFileSync(logFile, JSON.stringify(uploadLog, null, 2));

  console.log("\n🎉 Загрузка завершена!");
  console.log(`✅ Загружено: ${uploaded}`);
  console.log(`⏭️  Пропущено: ${skipped}`);
  console.log(`❌ Ошибок: ${errors}`);
  console.log(`📄 Лог сохранен в: ${logFile}`);

  // Создаем файл с URL маппингом
  const urlMapping = {};
  Object.keys(uploadLog).forEach((localPath) => {
    urlMapping[localPath] = uploadLog[localPath].cloudinary_url;
  });

  const mappingFile = path.join(__dirname, "url-mapping.json");
  fs.writeFileSync(mappingFile, JSON.stringify(urlMapping, null, 2));
  console.log(`🔗 URL маппинг сохранен в: ${mappingFile}`);
}

// Функция для создания скрипта замены в коде
function generateReplaceScript() {
  if (!fs.existsSync(logFile)) {
    console.log("❌ Сначала загрузите изображения!");
    return;
  }

  const uploadLog = JSON.parse(fs.readFileSync(logFile, "utf8"));

  const replaceScript = path.join(__dirname, "replace-image-urls.js");
  const scriptContent = `
// Скрипт для замены локальных путей на Cloudinary URLs
const fs = require('fs');
const path = require('path');

const urlMapping = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(uploadLog).map(([localPath, info]) => [
        localPath,
        info.cloudinary_url,
      ])
    ),
    null,
    2
  )};

// Функция для замены в файле
function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  Object.entries(urlMapping).forEach(([localPath, cloudinaryUrl]) => {
    // Простая замена без регулярных выражений
    if (content.includes(localPath)) {
      content = content.replaceAll(localPath, cloudinaryUrl);
      changed = true;
    }
  });
    if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('✅ Обновлен: ' + filePath);
  }
}

// Обновляем все TypeScript и JavaScript файлы
const srcDir = path.join(__dirname, '../src');
function updateFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      updateFiles(filePath);
    } else if (/\\.(ts|tsx|js|jsx)$/.test(file)) {
      replaceInFile(filePath);
    }
  }
}

console.log('🔄 Начинаю замену URL в коде...');
updateFiles(srcDir);
console.log('✅ Замена завершена!');
`;

  fs.writeFileSync(replaceScript, scriptContent);
  console.log(`🔧 Скрипт замены создан: ${replaceScript}`);
}

// Запуск
if (require.main === module) {
  const command = process.argv[2];

  if (command === "upload") {
    uploadAllImages().catch(console.error);
  } else if (command === "replace") {
    generateReplaceScript();
  } else {
    console.log("Использование:");
    console.log(
      "  node upload-to-cloudinary.js upload   - Загрузить изображения"
    );
    console.log(
      "  node upload-to-cloudinary.js replace  - Создать скрипт замены URL"
    );
  }
}
