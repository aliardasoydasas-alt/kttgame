import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const questionBankPath = path.join(projectRoot, "electron", "generated", "question-bank.ts");
const questionDir = path.join(projectRoot, "public", "questions");
const outputPaths = [
  path.join(projectRoot, "public", "questions", "_sources.json"),
  path.join(projectRoot, "src", "generated", "question-sources.json")
];

const exts = ["jpg", "jpeg", "png", "webp", "gif"];

function parseQuestionBank(raw) {
  const match = raw.match(/DEFAULT_QUESTION_BANK:\s*QuestionItem\[\]\s*=\s*(\[[\s\S]*\]);\s*$/);
  if (!match) {
    throw new Error("Question bank parse edilemedi.");
  }

  return JSON.parse(match[1]);
}

function slugFromImage(imagePath) {
  return path.basename(imagePath).replace(/\.svg$/i, "");
}

async function findLocalFile(slug) {
  for (const ext of exts) {
    const absolutePath = path.join(questionDir, `${slug}.${ext}`);
    try {
      await fs.access(absolutePath);
      return `/questions/${slug}.${ext}`;
    } catch {
      // try next extension
    }
  }

  return null;
}

const raw = await fs.readFile(questionBankPath, "utf8");
const questions = parseQuestionBank(raw);
const curatedManifest = {};
const missing = [];

for (const question of questions) {
  const slug = slugFromImage(question.image);
  const localFile = await findLocalFile(slug);

  if (!localFile) {
    missing.push(slug);
    continue;
  }

  curatedManifest[slug] = {
    answer: question.correctAnswer,
    title: question.correctAnswer,
    city: question.city,
    country: question.country,
    difficulty: question.difficulty,
    wiki: "local-curated",
    source: "local-curated",
    fileName: path.basename(localFile),
    localFile
  };
}

if (missing.length) {
  throw new Error(`Eksik yerel gorseller: ${missing.join(", ")}`);
}

for (const outputPath of outputPaths) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(curatedManifest, null, 2), "utf8");
}

console.log(`Locked curated manifest for ${questions.length} questions.`);
