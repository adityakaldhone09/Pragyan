import { api } from "@/services/apiClient";

export type NoteFormat = "pdf" | "markdown" | "text";

export interface GenerateNoteInput {
  topic?: string;
  responseText: string;
  format: NoteFormat;
  source?: string;
  sourceMessageId?: string;
}

export interface GeneratedNoteDownload {
  note: {
    id: string;
    topic: string;
    format: NoteFormat;
    fileName: string;
    mimeType: string;
    byteSize: number;
    generatedAt: string;
    metadata: unknown;
  };
  download: {
    fileName: string;
    mimeType: string;
    encoding: "base64" | "utf-8";
    content: string;
  };
}

export const notesService = {
  generate(input: GenerateNoteInput) {
    return api.post<GeneratedNoteDownload>("/notes/generate", input);
  },
};
