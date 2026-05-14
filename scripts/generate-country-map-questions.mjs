import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const MAP_OUTPUT_DIR = path.join(ROOT, "public", "map-questions");
const BANK_OUTPUT_FILE = path.join(ROOT, "electron", "generated", "country-map-question-bank.ts");

const PAPER_WIDTH = 900;
const PAPER_HEIGHT = 600;
const PAPER_PADDING = 74;

const COUNTRIES = [
  { code: "TUR", slug: "turkiye-map", name: "Turkiye", region: "Avrupa", difficulty: "medium" },
  { code: "ITA", slug: "italya-map", name: "Italya", region: "Avrupa", difficulty: "easy" },
  { code: "ESP", slug: "ispanya-map", name: "Ispanya", region: "Avrupa", difficulty: "medium" },
  { code: "FRA", slug: "fransa-map", name: "Fransa", region: "Avrupa", difficulty: "medium" },
  { code: "DEU", slug: "almanya-map", name: "Almanya", region: "Avrupa", difficulty: "medium" },
  { code: "GBR", slug: "birlesik-krallik-map", name: "Birlesik Krallik", region: "Avrupa", difficulty: "easy" },
  { code: "GRC", slug: "yunanistan-map", name: "Yunanistan", region: "Avrupa", difficulty: "medium" },
  { code: "NOR", slug: "norvec-map", name: "Norvec", region: "Avrupa", difficulty: "easy" },
  { code: "SWE", slug: "isvec-map", name: "Isvec", region: "Avrupa", difficulty: "medium" },
  { code: "FIN", slug: "finlandiya-map", name: "Finlandiya", region: "Avrupa", difficulty: "medium" },
  { code: "ISL", slug: "izlanda-map", name: "Izlanda", region: "Avrupa", difficulty: "easy" },
  { code: "PRT", slug: "portekiz-map", name: "Portekiz", region: "Avrupa", difficulty: "medium" },
  { code: "IRL", slug: "irlanda-map", name: "Irlanda", region: "Avrupa", difficulty: "medium" },
  { code: "POL", slug: "polonya-map", name: "Polonya", region: "Avrupa", difficulty: "hard" },
  { code: "NLD", slug: "hollanda-map", name: "Hollanda", region: "Avrupa", difficulty: "hard" },
  { code: "HRV", slug: "hirvatistan-map", name: "Hirvatistan", region: "Avrupa", difficulty: "medium" },
  { code: "UKR", slug: "ukrayna-map", name: "Ukrayna", region: "Avrupa", difficulty: "medium" },
  { code: "DNK", slug: "danimarka-map", name: "Danimarka", region: "Avrupa", difficulty: "medium" },
  { code: "ROU", slug: "romanya-map", name: "Romanya", region: "Avrupa", difficulty: "hard" },
  { code: "JPN", slug: "japonya-map", name: "Japonya", region: "Asya", difficulty: "easy" },
  { code: "KOR", slug: "guney-kore-map", name: "Guney Kore", region: "Asya", difficulty: "medium" },
  { code: "CHN", slug: "cin-map", name: "Cin", region: "Asya", difficulty: "medium" },
  { code: "IND", slug: "hindistan-map", name: "Hindistan", region: "Asya", difficulty: "easy" },
  { code: "SAU", slug: "suudi-arabistan-map", name: "Suudi Arabistan", region: "Asya", difficulty: "easy" },
  { code: "THA", slug: "tayland-map", name: "Tayland", region: "Asya", difficulty: "medium" },
  { code: "VNM", slug: "vietnam-map", name: "Vietnam", region: "Asya", difficulty: "medium" },
  { code: "IDN", slug: "endonezya-map", name: "Endonezya", region: "Asya", difficulty: "medium" },
  { code: "PHL", slug: "filipinler-map", name: "Filipinler", region: "Asya", difficulty: "medium" },
  { code: "NPL", slug: "nepal-map", name: "Nepal", region: "Asya", difficulty: "medium" },
  { code: "LKA", slug: "sri-lanka-map", name: "Sri Lanka", region: "Asya", difficulty: "easy" },
  { code: "EGY", slug: "misir-map", name: "Misir", region: "Afrika", difficulty: "easy" },
  { code: "ZAF", slug: "guney-afrika-map", name: "Guney Afrika", region: "Afrika", difficulty: "easy" },
  { code: "MDG", slug: "madagaskar-map", name: "Madagaskar", region: "Afrika", difficulty: "easy" },
  { code: "MAR", slug: "fas-map", name: "Fas", region: "Afrika", difficulty: "medium" },
  { code: "DZA", slug: "cezayir-map", name: "Cezayir", region: "Afrika", difficulty: "medium" },
  { code: "KEN", slug: "kenya-map", name: "Kenya", region: "Afrika", difficulty: "hard" },
  { code: "ETH", slug: "etiyopya-map", name: "Etiyopya", region: "Afrika", difficulty: "medium" },
  { code: "USA", slug: "abd-map", name: "Amerika Birlesik Devletleri", region: "Amerika", difficulty: "easy" },
  { code: "CAN", slug: "kanada-map", name: "Kanada", region: "Amerika", difficulty: "medium" },
  { code: "MEX", slug: "meksika-map", name: "Meksika", region: "Amerika", difficulty: "easy" },
  { code: "BRA", slug: "brezilya-map", name: "Brezilya", region: "Amerika", difficulty: "easy" },
  { code: "ARG", slug: "arjantin-map", name: "Arjantin", region: "Amerika", difficulty: "medium" },
  { code: "CHL", slug: "sili-map", name: "Sili", region: "Amerika", difficulty: "easy" },
  { code: "PER", slug: "peru-map", name: "Peru", region: "Amerika", difficulty: "medium" },
  { code: "COL", slug: "kolombiya-map", name: "Kolombiya", region: "Amerika", difficulty: "medium" },
  { code: "CUB", slug: "kuba-map", name: "Kuba", region: "Amerika", difficulty: "easy" },
  { code: "AUS", slug: "avustralya-map", name: "Avustralya", region: "Okyanusya", difficulty: "easy" },
  { code: "NZL", slug: "yeni-zelanda-map", name: "Yeni Zelanda", region: "Okyanusya", difficulty: "medium" }
];

function seededRotation(items, offset) {
  if (!items.length) {
    return [];
  }

  const normalizedOffset = offset % items.length;
  return [...items.slice(normalizedOffset), ...items.slice(0, normalizedOffset)];
}

function buildOptions(country, index) {
  const sameRegion = COUNTRIES.filter((item) => item.region === country.region && item.code !== country.code);
  const sameDifficulty = COUNTRIES.filter(
    (item) => item.difficulty === country.difficulty && item.code !== country.code && item.region !== country.region
  );
  const fallbackPool = COUNTRIES.filter((item) => item.code !== country.code);

  const pool = [...seededRotation(sameRegion, index), ...seededRotation(sameDifficulty, index + 1), ...seededRotation(fallbackPool, index + 2)];
  const distractors = [];
  const seen = new Set([country.code]);

  for (const candidate of pool) {
    if (seen.has(candidate.code)) {
      continue;
    }

    seen.add(candidate.code);
    distractors.push(candidate.name);
    if (distractors.length === 3) {
      break;
    }
  }

  const options = [country.name, ...distractors];
  const rotation = index % options.length;
  return seededRotation(options, rotation);
}

function flattenGeometryCoordinates(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates;
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat();
  }

  return [];
}

function createMapPath(featureCollection) {
  const rings = [];

  for (const feature of featureCollection.features ?? []) {
    for (const ring of flattenGeometryCoordinates(feature.geometry)) {
      rings.push(
        ring.map(([longitude, latitude]) => ({
          x: longitude,
          y: -latitude
        }))
      );
    }
  }

  const points = rings.flat();
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const scale = Math.min((PAPER_WIDTH - PAPER_PADDING * 2) / width, (PAPER_HEIGHT - PAPER_PADDING * 2) / height);
  const offsetX = (PAPER_WIDTH - width * scale) / 2 - minX * scale;
  const offsetY = (PAPER_HEIGHT - height * scale) / 2 - minY * scale;

  return rings
    .map((ring) => {
      const [first, ...rest] = ring;
      const start = `M ${(first.x * scale + offsetX).toFixed(2)} ${(first.y * scale + offsetY).toFixed(2)}`;
      const segments = rest.map((point) => `L ${(point.x * scale + offsetX).toFixed(2)} ${(point.y * scale + offsetY).toFixed(2)}`).join(" ");
      return `${start} ${segments} Z`;
    })
    .join(" ");
}

function buildSvg(pathData) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAPER_WIDTH} ${PAPER_HEIGHT}" role="img" aria-label="Ulke haritasi">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fffdf8"/>
      <stop offset="100%" stop-color="#fff3d2"/>
    </linearGradient>
    <filter id="mapShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#b58f42" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect x="22" y="22" width="${PAPER_WIDTH - 44}" height="${PAPER_HEIGHT - 44}" rx="34" fill="url(#paper)" stroke="#e3d0a7" stroke-width="2"/>
  <g filter="url(#mapShadow)">
    <path d="${pathData}" fill="#201813" stroke="#d52830" stroke-width="8" stroke-linejoin="round" fill-rule="evenodd"/>
  </g>
</svg>
`;
}

async function fetchGeoJson(code) {
  const response = await fetch(`https://raw.githubusercontent.com/johan/world.geo.json/master/countries/${code}.geo.json`);
  if (!response.ok) {
    throw new Error(`geojson-fetch-failed:${code}`);
  }

  return response.json();
}

async function main() {
  await fs.mkdir(MAP_OUTPUT_DIR, { recursive: true });

  const questions = [];

  for (const [index, country] of COUNTRIES.entries()) {
    const geoJson = await fetchGeoJson(country.code);
    const pathData = createMapPath(geoJson);
    const svg = buildSvg(pathData);
    const imagePath = `/map-questions/${country.slug}.svg`;

    await fs.writeFile(path.join(MAP_OUTPUT_DIR, `${country.slug}.svg`), svg, "utf8");

    questions.push({
      id: `map-q-${String(index + 1).padStart(3, "0")}`,
      gameMode: "country-map",
      image: imagePath,
      questionText: "Bu harita hangi ulkeye aittir?",
      options: buildOptions(country, index),
      correctAnswer: country.name,
      city: country.region,
      country: country.name,
      difficulty: country.difficulty
    });
  }

  const output = `import type { QuestionItem } from "../types";

export const COUNTRY_MAP_QUESTION_BANK: QuestionItem[] = ${JSON.stringify(questions, null, 2)};
`;

  await fs.writeFile(BANK_OUTPUT_FILE, output, "utf8");
  console.log(`Generated ${questions.length} country map questions.`);
}

await main();
