import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const generatedDir = path.join(projectRoot, "electron", "generated");
const publicQuestionsDir = path.join(projectRoot, "public", "questions");
const publicUiDir = path.join(projectRoot, "public", "ui");
const publicSoundDir = path.join(projectRoot, "public", "sounds");

const QUESTION_TEXT = "Bu görselde öne çıkan turistik yer hangisidir?";

const locations = [
  { slug: "efes-antik-kenti", answer: "Efes Antik Kenti", city: "İzmir", country: "Türkiye", difficulty: "easy", category: "turkey-ancient" },
  { slug: "bergama-akropol", answer: "Bergama Akropolü", city: "İzmir", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "hierapolis", answer: "Hierapolis", city: "Denizli", country: "Türkiye", difficulty: "easy", category: "turkey-ancient" },
  { slug: "aspendos-tiyatrosu", answer: "Aspendos Tiyatrosu", city: "Antalya", country: "Türkiye", difficulty: "easy", category: "turkey-ancient" },
  { slug: "ani-harabeleri", answer: "Ani Harabeleri", city: "Kars", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "gobeklitepe", answer: "Göbeklitepe", city: "Şanlıurfa", country: "Türkiye", difficulty: "easy", category: "turkey-ancient" },
  { slug: "nemrut-dagi-heykelleri", answer: "Nemrut Dağı Heykelleri", city: "Adıyaman", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "truva-antik-kenti", answer: "Truva Antik Kenti", city: "Çanakkale", country: "Türkiye", difficulty: "easy", category: "turkey-ancient" },
  { slug: "catalhoyuk", answer: "Çatalhöyük", city: "Konya", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "perge-antik-kenti", answer: "Perge Antik Kenti", city: "Antalya", country: "Türkiye", difficulty: "easy", category: "turkey-ancient" },
  { slug: "patara-antik-kenti", answer: "Patara Antik Kenti", city: "Antalya", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "olympos-antik-kenti", answer: "Olympos Antik Kenti", city: "Antalya", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "side-apollon-tapinagi", answer: "Side Apollon Tapınağı", city: "Antalya", country: "Türkiye", difficulty: "easy", category: "turkey-ancient" },
  { slug: "alacahoyuk", answer: "Alacahöyük", city: "Çorum", country: "Türkiye", difficulty: "hard", category: "turkey-ancient" },
  { slug: "hattusa", answer: "Hattuşa", city: "Çorum", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "aphrodisias", answer: "Aphrodisias", city: "Aydın", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "xanthos", answer: "Xanthos", city: "Antalya", country: "Türkiye", difficulty: "hard", category: "turkey-ancient" },
  { slug: "letoon", answer: "Letoon", city: "Muğla", country: "Türkiye", difficulty: "hard", category: "turkey-ancient" },
  { slug: "sagalassos", answer: "Sagalassos", city: "Burdur", country: "Türkiye", difficulty: "hard", category: "turkey-ancient" },
  { slug: "laodikeia", answer: "Laodikeia", city: "Denizli", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "zeugma-mozaikleri", answer: "Zeugma Mozaikleri", city: "Gaziantep", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "myra-antik-kenti", answer: "Myra Antik Kenti", city: "Antalya", country: "Türkiye", difficulty: "medium", category: "turkey-ancient" },
  { slug: "sumela-manastiri", answer: "Sümela Manastırı", city: "Trabzon", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "safranbolu-evleri", answer: "Safranbolu Evleri", city: "Karabük", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "mardin-eski-sehir", answer: "Mardin Eski Şehir", city: "Mardin", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "balikligol", answer: "Balıklıgöl", city: "Şanlıurfa", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "ayasofya", answer: "Ayasofya", city: "İstanbul", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "sultanahmet-camii", answer: "Sultanahmet Camii", city: "İstanbul", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "topkapi-sarayi", answer: "Topkapı Sarayı", city: "İstanbul", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "galata-kulesi", answer: "Galata Kulesi", city: "İstanbul", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "kiz-kulesi", answer: "Kız Kulesi", city: "İstanbul", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "mevlana-muzesi", answer: "Mevlana Müzesi", city: "Konya", country: "Türkiye", difficulty: "easy", category: "turkey-heritage" },
  { slug: "divrigi-ulu-camii", answer: "Divriği Ulu Camii", city: "Sivas", country: "Türkiye", difficulty: "hard", category: "turkey-heritage" },
  { slug: "ishak-pasa-sarayi", answer: "İshak Paşa Sarayı", city: "Ağrı", country: "Türkiye", difficulty: "medium", category: "turkey-heritage" },
  { slug: "van-akdamar-kilisesi", answer: "Akdamar Kilisesi", city: "Van", country: "Türkiye", difficulty: "medium", category: "turkey-heritage" },
  { slug: "gumushane-karaca-magarasi", answer: "Karaca Mağarası", city: "Gümüşhane", country: "Türkiye", difficulty: "medium", category: "turkey-natural" },
  { slug: "pamukkale-travertenleri", answer: "Pamukkale Travertenleri", city: "Denizli", country: "Türkiye", difficulty: "easy", category: "turkey-natural" },
  { slug: "kapadokya-peribacalari", answer: "Kapadokya Peribacaları", city: "Nevşehir", country: "Türkiye", difficulty: "easy", category: "turkey-natural" },
  { slug: "oludeniz", answer: "Ölüdeniz", city: "Muğla", country: "Türkiye", difficulty: "easy", category: "turkey-natural" },
  { slug: "salda-golu", answer: "Salda Gölü", city: "Burdur", country: "Türkiye", difficulty: "easy", category: "turkey-natural" },
  { slug: "uzungol", answer: "Uzungöl", city: "Trabzon", country: "Türkiye", difficulty: "easy", category: "turkey-natural" },
  { slug: "saklikent-kanyonu", answer: "Saklıkent Kanyonu", city: "Muğla", country: "Türkiye", difficulty: "medium", category: "turkey-natural" },
  { slug: "manavgat-selalesi", answer: "Manavgat Şelalesi", city: "Antalya", country: "Türkiye", difficulty: "easy", category: "turkey-natural" },
  { slug: "tortum-selalesi", answer: "Tortum Şelalesi", city: "Erzurum", country: "Türkiye", difficulty: "medium", category: "turkey-natural" },
  { slug: "nemrut-krater-golu", answer: "Nemrut Krater Gölü", city: "Bitlis", country: "Türkiye", difficulty: "hard", category: "turkey-natural" },
  { slug: "ihlara-vadisi", answer: "Ihlara Vadisi", city: "Aksaray", country: "Türkiye", difficulty: "medium", category: "turkey-natural" },
  { slug: "yalova-yuruyen-kosk", answer: "Yürüyen Köşk", city: "Yalova", country: "Türkiye", difficulty: "medium", category: "turkey-city" },
  { slug: "ankara-anitkabir", answer: "Anıtkabir", city: "Ankara", country: "Türkiye", difficulty: "easy", category: "turkey-city" },
  { slug: "izmir-saat-kulesi", answer: "İzmir Saat Kulesi", city: "İzmir", country: "Türkiye", difficulty: "easy", category: "turkey-city" },
  { slug: "bursa-ulucamii", answer: "Bursa Ulu Camii", city: "Bursa", country: "Türkiye", difficulty: "easy", category: "turkey-city" },
  { slug: "antalya-kaleici", answer: "Kaleiçi", city: "Antalya", country: "Türkiye", difficulty: "easy", category: "turkey-city" },
  { slug: "gaziantep-zeugma-muzesi", answer: "Zeugma Mozaik Müzesi", city: "Gaziantep", country: "Türkiye", difficulty: "medium", category: "turkey-city" },
  { slug: "eskisehir-odunpazari", answer: "Odunpazarı Evleri", city: "Eskişehir", country: "Türkiye", difficulty: "easy", category: "turkey-city" },
  { slug: "amasya-yesilirmak-evleri", answer: "Amasya Yalıboyu Evleri", city: "Amasya", country: "Türkiye", difficulty: "medium", category: "turkey-city" },
  { slug: "adana-tas-kopru", answer: "Taş Köprü", city: "Adana", country: "Türkiye", difficulty: "easy", category: "turkey-city" },
  { slug: "kayseri-erciyes", answer: "Erciyes Dağı", city: "Kayseri", country: "Türkiye", difficulty: "medium", category: "turkey-city" },
  { slug: "konya-alaeddin-tepesi", answer: "Alaeddin Tepesi", city: "Konya", country: "Türkiye", difficulty: "medium", category: "turkey-city" },
  { slug: "mugla-akyaka", answer: "Akyaka", city: "Muğla", country: "Türkiye", difficulty: "medium", category: "turkey-city" },
  { slug: "eyfel-kulesi", answer: "Eyfel Kulesi", city: "Paris", country: "Fransa", difficulty: "easy", category: "world-icons" },
  { slug: "kolezyum", answer: "Kolezyum", city: "Roma", country: "İtalya", difficulty: "easy", category: "world-icons" },
  { slug: "big-ben", answer: "Big Ben", city: "Londra", country: "Birleşik Krallık", difficulty: "easy", category: "world-icons" },
  { slug: "sagrada-familia", answer: "Sagrada Familia", city: "Barselona", country: "İspanya", difficulty: "easy", category: "world-icons" },
  { slug: "machu-picchu", answer: "Machu Picchu", city: "Cusco", country: "Peru", difficulty: "easy", category: "world-icons" },
  { slug: "tac-mahal", answer: "Tac Mahal", city: "Agra", country: "Hindistan", difficulty: "easy", category: "world-icons" },
  { slug: "petra", answer: "Petra", city: "Ma'an", country: "Ürdün", difficulty: "easy", category: "world-icons" },
  { slug: "gize-piramitleri", answer: "Gize Piramitleri", city: "Gize", country: "Mısır", difficulty: "easy", category: "world-icons" },
  { slug: "cin-seddi", answer: "Çin Seddi", city: "Pekin", country: "Çin", difficulty: "easy", category: "world-icons" },
  { slug: "ozgurluk-heykeli", answer: "Özgürlük Heykeli", city: "New York", country: "ABD", difficulty: "easy", category: "world-icons" },
  { slug: "louvre-muzesi", answer: "Louvre Müzesi", city: "Paris", country: "Fransa", difficulty: "easy", category: "world-icons" },
  { slug: "burj-khalifa", answer: "Burj Khalifa", city: "Dubai", country: "BAE", difficulty: "easy", category: "world-icons" },
  { slug: "chichen-itza", answer: "Chichen Itza", city: "Yucatán", country: "Meksika", difficulty: "medium", category: "world-icons" },
  { slug: "angkor-wat", answer: "Angkor Wat", city: "Siem Reap", country: "Kamboçya", difficulty: "medium", category: "world-icons" },
  { slug: "sydney-opera-house", answer: "Sydney Opera House", city: "Sydney", country: "Avustralya", difficulty: "easy", category: "world-icons" },
  { slug: "christ-the-redeemer", answer: "Christ the Redeemer", city: "Rio de Janeiro", country: "Brezilya", difficulty: "easy", category: "world-icons" },
  { slug: "neuschwanstein-sarayi", answer: "Neuschwanstein Şatosu", city: "Bavyera", country: "Almanya", difficulty: "medium", category: "world-icons" },
  { slug: "acropolis", answer: "Atina Akropolisi", city: "Atina", country: "Yunanistan", difficulty: "medium", category: "world-icons" },
  { slug: "stonehenge", answer: "Stonehenge", city: "Wiltshire", country: "Birleşik Krallık", difficulty: "medium", category: "world-icons" },
  { slug: "moai-heykelleri", answer: "Moai Heykelleri", city: "Paskalya Adası", country: "Şili", difficulty: "medium", category: "world-icons" },
  { slug: "brandenburg-kapisi", answer: "Brandenburg Kapısı", city: "Berlin", country: "Almanya", difficulty: "easy", category: "world-icons" },
  { slug: "atomium", answer: "Atomium", city: "Brüksel", country: "Belçika", difficulty: "medium", category: "world-icons" },
  { slug: "prag-kalesi", answer: "Prag Kalesi", city: "Prag", country: "Çekya", difficulty: "medium", category: "world-icons" },
  { slug: "charles-koprusu", answer: "Charles Köprüsü", city: "Prag", country: "Çekya", difficulty: "easy", category: "world-icons" },
  { slug: "alhambra", answer: "Elhamra Sarayı", city: "Granada", country: "İspanya", difficulty: "medium", category: "world-icons" },
  { slug: "mont-saint-michel", answer: "Mont Saint-Michel", city: "Normandiya", country: "Fransa", difficulty: "medium", category: "world-icons" },
  { slug: "pisa-kulesi", answer: "Pisa Kulesi", city: "Pisa", country: "İtalya", difficulty: "easy", category: "world-icons" },
  { slug: "trevi-cesmesi", answer: "Trevi Çeşmesi", city: "Roma", country: "İtalya", difficulty: "easy", category: "world-icons" },
  { slug: "grand-canyon", answer: "Grand Canyon", city: "Arizona", country: "ABD", difficulty: "medium", category: "world-natural" },
  { slug: "niagara-selalesi", answer: "Niagara Şelalesi", city: "Ontario", country: "Kanada", difficulty: "easy", category: "world-natural" },
  { slug: "uyuni-tuzlasi", answer: "Uyuni Tuzlası", city: "Potosí", country: "Bolivya", difficulty: "medium", category: "world-natural" },
  { slug: "ha-long-bay", answer: "Ha Long Bay", city: "Quang Ninh", country: "Vietnam", difficulty: "medium", category: "world-natural" },
  { slug: "banff-lake-louise", answer: "Lake Louise", city: "Alberta", country: "Kanada", difficulty: "medium", category: "world-natural" },
  { slug: "fuji-dagi", answer: "Fuji Dağı", city: "Shizuoka", country: "Japonya", difficulty: "easy", category: "world-natural" },
  { slug: "matterhorn", answer: "Matterhorn", city: "Zermatt", country: "İsviçre", difficulty: "medium", category: "world-natural" },
  { slug: "plivitce-golleri", answer: "Plitvice Gölleri", city: "Lika-Senj", country: "Hırvatistan", difficulty: "medium", category: "world-natural" },
  { slug: "iguazu-selaleleri", answer: "Iguazu Şelaleleri", city: "Misiones", country: "Arjantin", difficulty: "medium", category: "world-natural" },
  { slug: "serengeti", answer: "Serengeti", city: "Mara", country: "Tanzanya", difficulty: "hard", category: "world-natural" },
  { slug: "yellowstone", answer: "Yellowstone", city: "Wyoming", country: "ABD", difficulty: "medium", category: "world-natural" },
  { slug: "salar-de-atacama", answer: "Atacama Çölü", city: "San Pedro de Atacama", country: "Şili", difficulty: "hard", category: "world-natural" },
  { slug: "kotor-korfezi", answer: "Kotor Körfezi", city: "Kotor", country: "Karadağ", difficulty: "medium", category: "europe-highlights" },
  { slug: "bled-golu", answer: "Bled Gölü", city: "Bled", country: "Slovenya", difficulty: "medium", category: "europe-highlights" },
  { slug: "hallstatt", answer: "Hallstatt", city: "Hallstatt", country: "Avusturya", difficulty: "medium", category: "europe-highlights" },
  { slug: "dubrovnik-surlari", answer: "Dubrovnik Surları", city: "Dubrovnik", country: "Hırvatistan", difficulty: "medium", category: "europe-highlights" },
  { slug: "budapeşte-parlamento", answer: "Budapeşte Parlamento Binası", city: "Budapeşte", country: "Macaristan", difficulty: "easy", category: "europe-highlights" },
  { slug: "amsterdam-kanallari", answer: "Amsterdam Kanalları", city: "Amsterdam", country: "Hollanda", difficulty: "easy", category: "europe-highlights" },
  { slug: "lisbon-belem-kulesi", answer: "Belem Kulesi", city: "Lizbon", country: "Portekiz", difficulty: "medium", category: "europe-highlights" },
  { slug: "stockholm-gamla-stan", answer: "Gamla Stan", city: "Stockholm", country: "İsveç", difficulty: "medium", category: "europe-highlights" },
  { slug: "copenhagen-nyhavn", answer: "Nyhavn", city: "Kopenhag", country: "Danimarka", difficulty: "easy", category: "europe-highlights" },
  { slug: "oslo-opera-binası", answer: "Oslo Opera Binası", city: "Oslo", country: "Norveç", difficulty: "medium", category: "europe-highlights" },
  { slug: "viyana-schonbrunn", answer: "Schönbrunn Sarayı", city: "Viyana", country: "Avusturya", difficulty: "medium", category: "europe-highlights" },
  { slug: "warsaw-old-town", answer: "Varşova Eski Şehir", city: "Varşova", country: "Polonya", difficulty: "medium", category: "europe-highlights" }
];

const categoryIndex = new Map();
for (const location of locations) {
  const group = categoryIndex.get(location.category) ?? [];
  group.push(location);
  categoryIndex.set(location.category, group);
}

function createSeededNumber(seed) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function seededShuffle(items, seed) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const rand = createSeededNumber(`${seed}-${index}`);
    const swapIndex = Math.floor(rand * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function buildOptions(location) {
  const sameCategory = categoryIndex.get(location.category).filter((item) => item.answer !== location.answer);
  const sameCountry = locations.filter((item) => item.country === location.country && item.answer !== location.answer);
  const globalPool = locations.filter((item) => item.answer !== location.answer);

  const pool = [...sameCategory, ...sameCountry, ...globalPool];
  const unique = [];
  const seen = new Set([location.answer]);

  for (const item of pool) {
    if (!seen.has(item.answer)) {
      unique.push(item.answer);
      seen.add(item.answer);
    }

    if (unique.length === 3) {
      break;
    }
  }

  return seededShuffle([location.answer, ...unique], location.slug);
}

function getAccentForCategory(category) {
  if (category.includes("world")) return "#7d0c1d";
  if (category.includes("europe")) return "#9f2d25";
  if (category.includes("natural")) return "#445d3a";
  if (category.includes("city")) return "#aa641f";
  return "#5f1d6a";
}

function getShapeForSlug(slug) {
  const types = ["arch", "tower", "mount", "wave", "steps"];
  return types[Math.floor(createSeededNumber(slug) * types.length)];
}

function renderShape(shape, accent) {
  if (shape === "tower") {
    return `<rect x="278" y="118" width="84" height="232" rx="18" fill="${accent}" opacity="0.72"/><rect x="302" y="74" width="36" height="78" rx="12" fill="#fce8cc" opacity="0.88"/>`;
  }
  if (shape === "mount") {
    return `<path d="M120 342L238 168L318 258L396 144L528 342Z" fill="${accent}" opacity="0.76"/><path d="M214 206L240 168L268 204Z" fill="#fce8cc" opacity="0.88"/>`;
  }
  if (shape === "wave") {
    return `<path d="M64 278C116 242 154 232 202 232C262 232 302 288 362 288C422 288 444 234 530 228L530 342L64 342Z" fill="${accent}" opacity="0.78"/><circle cx="420" cy="146" r="42" fill="#fce8cc" opacity="0.84"/>`;
  }
  if (shape === "steps") {
    return `<path d="M146 330H452V294H392V256H334V220H274V182H214V144H146Z" fill="${accent}" opacity="0.8"/><path d="M412 138H466V330H412Z" fill="#fce8cc" opacity="0.86"/>`;
  }
  return `<path d="M146 340V170C146 146 164 128 188 128H450C474 128 492 146 492 170V340H438V220H200V340Z" fill="${accent}" opacity="0.78"/><circle cx="320" cy="174" r="26" fill="#fce8cc" opacity="0.88"/>`;
}

function createQuestionSvg(location) {
  const accent = getAccentForCategory(location.category);
  const shape = renderShape(getShapeForSlug(location.slug), accent);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="640" viewBox="0 0 640 400" role="img" aria-label="Turistik yer placeholder">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2b0910"/>
      <stop offset="60%" stop-color="#120407"/>
      <stop offset="100%" stop-color="#040404"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="24%" r="72%">
      <stop offset="0%" stop-color="rgba(255,208,154,0.55)"/>
      <stop offset="100%" stop-color="rgba(255,208,154,0)"/>
    </radialGradient>
  </defs>
  <rect width="640" height="400" fill="url(#bg)"/>
  <circle cx="320" cy="90" r="170" fill="url(#glow)"/>
  <rect x="34" y="32" width="572" height="336" rx="28" fill="none" stroke="rgba(255,255,255,0.12)" />
  ${shape}
  <text x="48" y="76" fill="#ffd7b3" font-family="Segoe UI, Arial, sans-serif" font-size="20" letter-spacing="3">KÜLTÜR VE TURİZM TOPLULUĞU</text>
  <text x="48" y="360" fill="#fff4ea" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700">${location.city}, ${location.country}</text>
  <text x="48" y="394" fill="#ffbd87" font-family="Segoe UI, Arial, sans-serif" font-size="18">Placeholder görsel: gerçek fotoğraf ile değiştirilebilir</text>
</svg>`;
}

function createUiPlaceholder() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2f0a12"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <rect x="90" y="90" width="1020" height="620" rx="36" fill="none" stroke="#ffffff22" stroke-width="4"/>
  <circle cx="600" cy="310" r="120" fill="#7d0c1d" opacity="0.75"/>
  <path d="M470 500L600 240L730 500Z" fill="#ffd3a4" opacity="0.85"/>
  <text x="600" y="620" text-anchor="middle" fill="#fff1e3" font-family="Segoe UI, Arial" font-size="42" font-weight="700">Görsel yüklenemedi</text>
  <text x="600" y="670" text-anchor="middle" fill="#ffbf90" font-family="Segoe UI, Arial" font-size="26">Yer tutucu kullanılmaktadır</text>
</svg>`;
}

function createWavBase64({ frequency, durationMs }) {
  const sampleRate = 22050;
  const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.max(0, 1 - index / sampleCount);
    const sample = Math.sin(2 * Math.PI * frequency * time) * 0.4 * envelope;
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + index * 2);
  }

  return buffer;
}

async function ensureDirectories() {
  await fs.mkdir(generatedDir, { recursive: true });
  await fs.mkdir(publicQuestionsDir, { recursive: true });
  await fs.mkdir(publicUiDir, { recursive: true });
  await fs.mkdir(publicSoundDir, { recursive: true });
}

async function writeQuestions() {
  const questionBank = locations.map((location, index) => ({
    id: `q-${String(index + 1).padStart(3, "0")}`,
    image: `/questions/${location.slug}.svg`,
    questionText: QUESTION_TEXT,
    options: buildOptions(location),
    correctAnswer: location.answer,
    city: location.city,
    country: location.country,
    difficulty: location.difficulty
  }));

  const content = `import type { QuestionItem } from "../types";

export const DEFAULT_QUESTION_BANK: QuestionItem[] = ${JSON.stringify(questionBank, null, 2)};\n`;

  await fs.writeFile(path.join(generatedDir, "question-bank.ts"), content, "utf8");
}

async function writeQuestionImages() {
  await Promise.all(
    locations.map((location) =>
      fs.writeFile(path.join(publicQuestionsDir, `${location.slug}.svg`), createQuestionSvg(location), "utf8")
    )
  );
}

async function writeUiAssets() {
  await fs.writeFile(path.join(publicUiDir, "image-fallback.svg"), createUiPlaceholder(), "utf8");
}

async function writeSoundAssets() {
  const sounds = [
    ["correct.wav", { frequency: 740, durationMs: 220 }],
    ["wrong.wav", { frequency: 240, durationMs: 280 }],
    ["wheel.wav", { frequency: 480, durationMs: 420 }],
    ["reward.wav", { frequency: 920, durationMs: 480 }]
  ];

  await Promise.all(
    sounds.map(([fileName, config]) => fs.writeFile(path.join(publicSoundDir, fileName), createWavBase64(config)))
  );
}

await ensureDirectories();
await writeQuestions();
await writeQuestionImages();
await writeUiAssets();
await writeSoundAssets();

console.log(`Generated ${locations.length} question placeholders and supporting assets.`);
