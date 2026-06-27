import type { GeneratedNoteDownload } from "./notesService";

function base64ToBlob(content: string, mimeType: string) {
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

export function downloadGeneratedNote(payload: GeneratedNoteDownload) {
  const blob = payload.download.encoding === "base64"
    ? base64ToBlob(payload.download.content, payload.download.mimeType)
    : new Blob([payload.download.content], { type: payload.download.mimeType });

  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = payload.download.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export function inferNoteTopic(text: string) {
  const firstLine = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .split("\n")
    .map(line => line.trim())
    .find(Boolean);

  return firstLine?.replace(/^#+\s*/, "").slice(0, 90) || "AI Learning Notes";
}

export function isEducationalResponse(text: string) {
  const normalized = text.toLowerCase();
  const learningSignals = [
    "definition",
    "example",
    "syntax",
    "code",
    "practice",
    "learn",
    "concept",
    "topic",
    "array",
    "algorithm",
    "data structure",
    "interview question",
    "common mistake",
  ];

  return learningSignals.some(signal => normalized.includes(signal));
}
