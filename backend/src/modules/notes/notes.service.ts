import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { GenerateNoteInput, ListNotesQuery } from './notes.validators';

type NotesFormat = GenerateNoteInput['format'];

interface NotesSections {
  topic: string;
  explanation: string;
  examples: string[];
  keyPoints: string[];
  code: string;
  summary: string;
  generatedDate: string;
}

function stripMarkdown(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s+/gm, '')
    .trim();
}

function extractCode(text: string) {
  const blocks = Array.from(text.matchAll(/```(?:\w+)?\n?([\s\S]*?)```/g))
    .map((match) => match[1]?.trim())
    .filter(Boolean);

  return blocks.length ? blocks.join('\n\n') : 'No code snippet was included in the original AI response.';
}

function inferTopic(input: GenerateNoteInput) {
  if (input.topic?.trim()) return input.topic.trim();

  const firstMeaningfulLine = stripMarkdown(input.responseText)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstMeaningfulLine ? firstMeaningfulLine.slice(0, 90) : 'AI Learning Notes';
}

function deriveKeyPoints(text: string) {
  const lines = stripMarkdown(text)
    .split('\n')
    .map((line) => line.replace(/^[-*0-9.)\s]+/, '').trim())
    .filter((line) => line.length >= 12);

  return Array.from(new Set(lines)).slice(0, 6);
}

function deriveExamples(text: string) {
  const lines = stripMarkdown(text)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /example|for instance|such as|syntax|code/i.test(line));

  return lines.length ? lines.slice(0, 4) : ['Review the explanation and convert one concept into a small hands-on example.'];
}

function buildSections(input: GenerateNoteInput): NotesSections {
  const topic = inferTopic(input);
  const cleanText = stripMarkdown(input.responseText);
  const generatedDate = new Date().toISOString();

  return {
    topic,
    explanation: cleanText || input.responseText,
    examples: deriveExamples(input.responseText),
    keyPoints: deriveKeyPoints(input.responseText),
    code: extractCode(input.responseText),
    summary: cleanText.slice(0, 500) || `Summary notes for ${topic}.`,
    generatedDate,
  };
}

function renderMarkdown(sections: NotesSections) {
  return [
    `# ${sections.topic}`,
    '',
    `Generated Date: ${sections.generatedDate}`,
    '',
    '## Explanation',
    sections.explanation,
    '',
    '## Examples',
    ...sections.examples.map((item) => `- ${item}`),
    '',
    '## Key Points',
    ...sections.keyPoints.map((item) => `- ${item}`),
    '',
    '## Code',
    '```',
    sections.code,
    '```',
    '',
    '## Summary',
    sections.summary,
    '',
  ].join('\n');
}

function renderText(sections: NotesSections) {
  return [
    sections.topic,
    `Generated Date: ${sections.generatedDate}`,
    '',
    'Explanation',
    sections.explanation,
    '',
    'Examples',
    ...sections.examples.map((item) => `- ${item}`),
    '',
    'Key Points',
    ...sections.keyPoints.map((item) => `- ${item}`),
    '',
    'Code',
    sections.code,
    '',
    'Summary',
    sections.summary,
    '',
  ].join('\n');
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLines(text: string, max = 88) {
  return text.split('\n').flatMap((line) => {
    const words = line.split(/\s+/);
    const output: string[] = [];
    let current = '';

    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length > max) {
        if (current) output.push(current);
        current = word;
      } else {
        current = next;
      }
    });

    output.push(current);
    return output;
  });
}

function renderPdfBase64(sections: NotesSections) {
  const lines = wrapLines(renderText(sections)).slice(0, 140);
  const textOps = lines.map((line, index) => {
    const y = 760 - (index % 55) * 13;
    return `BT /F1 10 Tf 48 ${y} Td (${escapePdfText(line || ' ')}) Tj ET`;
  });

  const stream = textOps.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf).toString('base64');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'ai-notes';
}

function renderDownload(format: NotesFormat, sections: NotesSections) {
  if (format === 'pdf') {
    return {
      content: renderPdfBase64(sections),
      encoding: 'base64' as const,
      extension: 'pdf',
      mimeType: 'application/pdf',
    };
  }

  if (format === 'markdown') {
    return {
      content: renderMarkdown(sections),
      encoding: 'utf-8' as const,
      extension: 'md',
      mimeType: 'text/markdown',
    };
  }

  return {
    content: renderText(sections),
    encoding: 'utf-8' as const,
    extension: 'txt',
    mimeType: 'text/plain',
  };
}

export const notesService = {
  async generate(userId: string, input: GenerateNoteInput) {
    const sections = buildSections(input);
    const download = renderDownload(input.format, sections);
    const fileName = `${slugify(sections.topic)}-notes.${download.extension}`;
    const byteSize = download.encoding === 'base64'
      ? Buffer.byteLength(download.content, 'base64')
      : Buffer.byteLength(download.content);
    const contentHash = crypto
      .createHash('sha256')
      .update([userId, input.format, sections.topic, input.responseText].join('\n'))
      .digest('hex');

    const metadata = {
      topic: sections.topic,
      source: input.source,
      sourceMessageId: input.sourceMessageId,
      format: input.format,
      generatedDate: sections.generatedDate,
      sections: ['Topic', 'Explanation', 'Examples', 'Key Points', 'Code', 'Summary', 'Generated Date'],
    };

    const existing = await prisma.generatedNote.findFirst({
      where: { userId, contentHash, format: input.format },
    });

    const note = existing
      ? await prisma.generatedNote.update({
          where: { id: existing.id },
          data: {
            topic: sections.topic,
            source: input.source,
            sourceMessageId: input.sourceMessageId,
            fileName,
            mimeType: download.mimeType,
            byteSize,
            metadata,
            content: download.encoding === 'utf-8' ? download.content : undefined,
            generatedAt: new Date(sections.generatedDate),
          },
        })
      : await prisma.generatedNote.create({
          data: {
            userId,
            topic: sections.topic,
            format: input.format,
            source: input.source,
            sourceMessageId: input.sourceMessageId,
            fileName,
            mimeType: download.mimeType,
            byteSize,
            contentHash,
            metadata,
            content: download.encoding === 'utf-8' ? download.content : undefined,
            generatedAt: new Date(sections.generatedDate),
          },
        });

    return {
      note: {
        id: note.id,
        topic: note.topic,
        format: note.format,
        fileName: note.fileName,
        mimeType: note.mimeType,
        byteSize: note.byteSize,
        generatedAt: note.generatedAt,
        metadata: note.metadata,
      },
      download: {
        fileName,
        mimeType: download.mimeType,
        encoding: download.encoding,
        content: download.content,
      },
    };
  },

  async list(userId: string, query: ListNotesQuery) {
    const where = {
      userId,
      ...(query.format ? { format: query.format } : {}),
      ...(query.search
        ? {
            OR: [
              { topic: { contains: query.search, mode: 'insensitive' as const } },
              { fileName: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return prisma.generatedNote.findMany({
      where,
      take: query.limit,
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        topic: true,
        format: true,
        source: true,
        sourceMessageId: true,
        fileName: true,
        mimeType: true,
        byteSize: true,
        metadata: true,
        generatedAt: true,
        createdAt: true,
      },
    });
  },
};
