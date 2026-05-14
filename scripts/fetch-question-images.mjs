import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const questionBankPath = path.join(projectRoot, "electron", "generated", "question-bank.ts");
const questionDir = path.join(projectRoot, "public", "questions");
const sourceManifestPath = path.join(projectRoot, "public", "questions", "_sources.json");
const sourceManifestCopyPath = path.join(projectRoot, "src", "generated", "question-sources.json");
const MANUAL_OVERRIDES_BY_SLUG = {
  "gobeklitepe": { title: "Göbeklitepe", wiki: "tr" },
  "catalhoyuk": { title: "Çatalhöyük", wiki: "tr" },
  "hattusa": { title: "Hattuşa", wiki: "tr" },
  "sumela-manastiri": { title: "Sümela Manastırı", wiki: "tr" },
  "topkapi-sarayi": { title: "Topkapı Sarayı", wiki: "tr" },
  "oludeniz": { title: "Ölüdeniz, Fethiye", wiki: "tr" },
  "amasya-yesilirmak-evleri": { title: "Amasya", wiki: "tr" },
  "petra": { title: "Petra", wiki: "en" },
  "louvre-muzesi": { title: "Louvre", wiki: "tr" },
  "burj-khalifa": { title: "Burj Khalifa", wiki: "tr" },
  "neuschwanstein-sarayi": { title: "Neuschwanstein Şatosu", wiki: "tr" },
  "prag-kalesi": { title: "Prag Kalesi", wiki: "tr" },
  "grand-canyon": { title: "Grand Canyon", wiki: "tr" },
  "uyuni-tuzlasi": {
    title: "Salar de Uyuni",
    wiki: "commons",
    directSource: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Waiting_Sunset_Salar_de_Uyuni_Bolivia_Luca_Galuzzi_2006.jpg/1280px-Waiting_Sunset_Salar_de_Uyuni_Bolivia_Luca_Galuzzi_2006.jpg",
    fileName: "File:Waiting Sunset Salar de Uyuni Bolivia Luca Galuzzi 2006.jpg"
  },
  "banff-lake-louise": { title: "Louise Gölü", wiki: "tr" },
  "kotor-korfezi": { title: "Kotor", wiki: "tr" },
  "amsterdam-kanallari": { title: "Amsterdam", wiki: "tr" },
  "copenhagen-nyhavn": { title: "Nyhavn", wiki: "en" }
};

const MANUAL_OVERRIDES = {
  "Efes Antik Kenti": { title: "Efes", wiki: "tr" },
  "Bergama Akropolü": { title: "Bergama", wiki: "tr" },
  "Göbeklitepe": { title: "Göbeklitepe", wiki: "tr" },
  "Nemrut Dağı Heykelleri": { title: "Nemrut Dağı", wiki: "tr" },
  "Truva Antik Kenti": { title: "Truva", wiki: "tr" },
  "Olympos Antik Kenti": { title: "Olympos", wiki: "tr" },
  "Akdamar Kilisesi": { title: "Akdamar Kilisesi", wiki: "tr" },
  "Christ the Redeemer": { title: "Kurtarıcı İsa Heykeli", wiki: "tr" },
  "Lake Louise": { title: "Louise Gölü", wiki: "tr" },
  "Ha Long Bay": { title: "Ha Long Körfezi", wiki: "tr" },
  "Charles Köprüsü": { title: "Karl Köprüsü", wiki: "tr" },
  "Atina Akropolisi": { title: "Akropolis", wiki: "tr" },
  "Brandenburg Kapısı": { title: "Brandenburg Kapısı", wiki: "tr" },
  "Budapeşte Parlamento Binası": { title: "Budapeşte Parlamento Binası", wiki: "tr" },
  "Varşova Eski Şehir": { title: "Varşova", wiki: "tr" },
  "Gamla Stan": { title: "Gamla stan", wiki: "tr" },
  "Nyhavn": { title: "Nyhavn", wiki: "tr" },
  "Schönbrunn Sarayı": { title: "Schönbrunn Sarayı", wiki: "tr" }
};

function parseQuestionBank(raw) {
  const match = raw.match(/DEFAULT_QUESTION_BANK:\s*QuestionItem\[\]\s*=\s*(\[[\s\S]*\]);\s*$/);
  if (!match) {
    throw new Error("Question bank parse edilemedi.");
  }
  return JSON.parse(match[1]);
}

function getSlug(imagePath) {
  return path.basename(imagePath).replace(/\.svg$/i, "");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeExt(contentType, url) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith(".png")) return "png";
  if (pathname.endsWith(".webp")) return "webp";
  if (pathname.endsWith(".gif")) return "gif";
  return "jpg";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGoodImageName(fileName = "") {
  const normalized = fileName.toLowerCase();
  const excludedBits = [
    ".svg",
    "map",
    "locator",
    "logo",
    "flag",
    "symbol",
    "emblem",
    "icon",
    "plan",
    "scheme",
    "blank",
    "location",
    "position",
    "non_political",
    "coat_of_arms"
  ];

  return !excludedBits.some((part) => normalized.includes(part));
}

async function fetchJson(url) {
  let lastError;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "user-agent": "kultur-turizm-stand-yarismasi-image-fetcher/1.0"
      }
    });

    if (response.ok) {
      return response.json();
    }

    lastError = new Error(`JSON istek hatası: ${response.status} ${url}`);
    if (response.status === 429 || response.status >= 500) {
      await sleep(600 * attempt);
      continue;
    }

    throw lastError;
  }

  throw lastError;
}

async function searchPage(query, wiki) {
  const url = `https://${wiki}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5&utf8=1`;
  const data = await fetchJson(url);
  return data.query?.search ?? [];
}

async function getPageImageByTitle(title, wiki) {
  const url =
    `https://${wiki}.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail|name&pithumbsize=1280` +
    `&titles=${encodeURIComponent(title)}&format=json`;
  const data = await fetchJson(url);
  const pages = Object.values(data.query?.pages ?? {});
  const page = pages.find((item) => item?.thumbnail?.source);

  if (page?.thumbnail?.source && isGoodImageName(page.pageimage)) {
    return {
      title: page.title,
      source: page.thumbnail.source,
      wiki,
      fileName: page.pageimage
    };
  }

  return getFallbackImageByTitle(title, wiki);
}

async function getFallbackImageByTitle(title, wiki) {
  const pageUrl =
    `https://${wiki}.wikipedia.org/w/api.php?action=query&prop=images&imlimit=20` +
    `&titles=${encodeURIComponent(title)}&format=json`;
  const pageData = await fetchJson(pageUrl);
  const pages = Object.values(pageData.query?.pages ?? {});
  const page = pages.find((item) => Array.isArray(item?.images) && item.images.length);

  if (!page) {
    return null;
  }

  for (const image of page.images) {
    const fileTitle = image.title ?? "";
    if (!isGoodImageName(fileTitle)) {
      continue;
    }

    const commonsUrl =
      "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json&titles=" +
      encodeURIComponent(fileTitle);
    const commonsData = await fetchJson(commonsUrl);
    const commonsPages = Object.values(commonsData.query?.pages ?? {});
    const commonsPage = commonsPages.find((item) => item?.imageinfo?.[0]?.thumburl || item?.imageinfo?.[0]?.url);

    if (commonsPage?.imageinfo?.[0]) {
      return {
        title: page.title,
        source: commonsPage.imageinfo[0].thumburl ?? commonsPage.imageinfo[0].url,
        wiki,
        fileName: fileTitle
      };
    }
  }

  return null;
}

async function searchCommonsImage(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=8&prop=imageinfo" +
    `&iiprop=url&iiurlwidth=1280&format=json&gsrsearch=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const pages = Object.values(data.query?.pages ?? {});

  for (const page of pages) {
    const title = page.title ?? "";
    if (!isGoodImageName(title)) {
      continue;
    }

    const info = page.imageinfo?.[0];
    if (info?.thumburl || info?.url) {
      return {
        title,
        source: info.thumburl ?? info.url,
        wiki: "commons",
        fileName: title
      };
    }
  }

  return null;
}

async function resolveImageSource(question) {
  const slug = getSlug(question.image);
  const override = MANUAL_OVERRIDES_BY_SLUG[slug] ?? MANUAL_OVERRIDES[question.correctAnswer];
  const attempts = [];

  if (override?.directSource) {
    return {
      title: override.title ?? question.correctAnswer,
      source: override.directSource,
      wiki: override.wiki ?? "commons",
      fileName: override.fileName ?? null
    };
  }

  if (override?.title) {
    attempts.push({ type: "title", title: override.title, wiki: override.wiki ?? "tr" });
  }

  attempts.push({ type: "search", query: question.correctAnswer, wiki: "tr" });
  attempts.push({ type: "search", query: `${question.correctAnswer} ${question.city}`, wiki: "tr" });
  attempts.push({ type: "search", query: question.correctAnswer, wiki: "en" });
  attempts.push({ type: "search", query: `${question.correctAnswer} ${question.country}`, wiki: "en" });
  attempts.push({ type: "commons", query: question.correctAnswer });
  attempts.push({ type: "commons", query: `${question.correctAnswer} ${question.city}` });

  for (const attempt of attempts) {
    try {
      if (attempt.type === "title") {
        const found = await getPageImageByTitle(attempt.title, attempt.wiki);
        if (found) {
          return found;
        }
        continue;
      }

      if (attempt.type === "commons") {
        const found = await searchCommonsImage(attempt.query);
        if (found) {
          return found;
        }
        continue;
      }

      const results = await searchPage(attempt.query, attempt.wiki);
      for (const result of results) {
        const found = await getPageImageByTitle(result.title, attempt.wiki);
        if (found) {
          return found;
        }
      }
    } catch {
      // Bir sonraki kaynağa geçiyoruz; tek bir başarısız arama tüm seti durdurmasın.
    }
  }

  return null;
}

async function downloadImage(url, slug) {
  let response;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    response = await fetch(url, {
      headers: {
        "user-agent": "kultur-turizm-stand-yarismasi-image-fetcher/1.0"
      }
    });

    if (response.ok) {
      break;
    }

    if (response.status === 429 || response.status >= 500) {
      await sleep(2500 * attempt);
      continue;
    }

    throw new Error(`Görsel indirilemedi: ${response.status} ${url}`);
  }

  if (!response?.ok) {
    throw new Error(`Görsel indirilemedi: ${response?.status ?? "?"} ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const ext = normalizeExt(contentType, url);
  const outputPath = path.join(questionDir, `${slug}.${ext}`);
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
  return { outputPath, ext };
}

function createWrapperSvg(slug, ext, titleText) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="640" viewBox="0 0 1024 640">
  <rect width="1024" height="640" fill="#120407"/>
  <image href="./${slug}.${ext}" x="0" y="0" width="1024" height="640" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1024" height="90" fill="url(#overlay)" opacity="0.96"/>
  <defs>
    <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1c0709"/>
      <stop offset="100%" stop-color="#3b0c12"/>
    </linearGradient>
  </defs>
  <text x="38" y="52" fill="#fff2e5" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700">${escapeXml(titleText)}</text>
  <text x="38" y="84" fill="#ffc88d" font-family="Segoe UI, Arial, sans-serif" font-size="20">Kultur ve Turizm Toplulugu</text>
</svg>`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function removeOldRasterVariants(slug) {
  const variants = ["jpg", "jpeg", "png", "webp", "gif"];
  for (const ext of variants) {
    const filePath = path.join(questionDir, `${slug}.${ext}`);
    await fs.rm(filePath, { force: true });
  }
}

async function main() {
  const raw = await fs.readFile(questionBankPath, "utf8");
  const questions = parseQuestionBank(raw);
  const manifest = (await fileExists(sourceManifestPath))
    ? JSON.parse(await fs.readFile(sourceManifestPath, "utf8"))
    : {};
  const failures = [];

  await fs.mkdir(questionDir, { recursive: true });

  for (const question of questions) {
    const slug = getSlug(question.image);
    const existingRaster = (await fs.readdir(questionDir)).find((name) => name.startsWith(`${slug}.`) && !name.endsWith(".svg"));
    const existingSvg = path.join(questionDir, `${slug}.svg`);

    if (existingRaster && (await fileExists(existingSvg))) {
      process.stdout.write(`Atlandı: ${question.correctAnswer}\n`);
      continue;
    }

    process.stdout.write(`Görsel aranıyor: ${question.correctAnswer}\n`);
    const resolved = await resolveImageSource(question);

    if (!resolved) {
      failures.push(question.correctAnswer);
      continue;
    }

    try {
      await removeOldRasterVariants(slug);
      const { ext } = await downloadImage(resolved.source, slug);
      await fs.writeFile(path.join(questionDir, `${slug}.svg`), createWrapperSvg(slug, ext, question.correctAnswer), "utf8");

      manifest[slug] = {
        answer: question.correctAnswer,
        title: resolved.title,
        wiki: resolved.wiki,
        source: resolved.source,
        fileName: resolved.fileName ?? null,
        localFile: `/questions/${slug}.${ext}`
      };
    } catch {
      failures.push(question.correctAnswer);
    }

    await sleep(1000);
  }

  await fs.writeFile(sourceManifestPath, JSON.stringify(manifest, null, 2), "utf8");
  await fs.mkdir(path.dirname(sourceManifestCopyPath), { recursive: true });
  await fs.writeFile(sourceManifestCopyPath, JSON.stringify(manifest, null, 2), "utf8");

  if (failures.length) {
    process.stdout.write(`\nEksik kalanlar (${failures.length}):\n${failures.join("\n")}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`\nTamamlandı. ${questions.length} soru için yerel görsel hazırlandı.\n`);
}

await main();
