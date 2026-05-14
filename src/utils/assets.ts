import questionSources from "../generated/question-sources.json";

type QuestionSourceMap = Record<string, { localFile?: string }>;

export function resolveAssetPath(assetPath: string) {
  if (!assetPath) {
    return assetPath;
  }

  if (/^(https?:|data:|blob:|file:)/i.test(assetPath)) {
    return assetPath;
  }

  const normalized = assetPath.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${normalized}`;
}

export function resolveQuestionImagePath(imagePath: string) {
  const normalized = imagePath.replace(/^\/+/, "");
  const slug = normalized.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
  const mapped = (questionSources as QuestionSourceMap)[slug]?.localFile;

  if (mapped) {
    return resolveAssetPath(mapped);
  }

  return resolveAssetPath(imagePath);
}
