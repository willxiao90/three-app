import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, basename, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const TEXTURES_DIR = join(
  __dirname,
  "..",
  "public",
  "models",
  "work_truck",
  "textures",
);
const MAX_SIZE = 1024;
const WEBP_QUALITY = 80;

async function optimize() {
  const files = await readdir(TEXTURES_DIR);
  const pngFiles = files.filter((f) => extname(f).toLowerCase() === ".png");

  console.log(`Found ${pngFiles.length} PNG textures to optimize:\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of pngFiles) {
    const inputPath = join(TEXTURES_DIR, file);
    const outputFile = basename(file, ".png") + ".webp";
    const outputPath = join(TEXTURES_DIR, outputFile);

    const inputSize = (await stat(inputPath)).size;
    totalBefore += inputSize;

    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const resizeOptions = {};
    if (metadata.width > MAX_SIZE || metadata.height > MAX_SIZE) {
      resizeOptions.width = MAX_SIZE;
      resizeOptions.height = MAX_SIZE;
      resizeOptions.fit = "inside";
    }

    await image.resize(resizeOptions).webp({ quality: WEBP_QUALITY }).toFile(outputPath);

    const outputSize = (await stat(outputPath)).size;
    totalAfter += outputSize;

    const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
    console.log(
      `  ${file} (${formatSize(inputSize)}) -> ${outputFile} (${formatSize(outputSize)}) [-${reduction}%]`,
    );
  }

  console.log(`\nTotal: ${formatSize(totalBefore)} -> ${formatSize(totalAfter)} [-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%]`);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

optimize().catch(console.error);
