# Notes API

## POST `/api/notes/generate`

Generates downloadable notes from an educational AI response and stores note metadata for the authenticated user.

Body:

```json
{
  "topic": "Arrays",
  "responseText": "AI response text",
  "format": "pdf",
  "source": "ai-counselor",
  "sourceMessageId": "message-3"
}
```

Formats:

- `pdf` returns base64 encoded `application/pdf`.
- `markdown` returns UTF-8 `text/markdown`.
- `text` returns UTF-8 `text/plain`.

Response data:

```json
{
  "note": {
    "id": "noteId",
    "topic": "Arrays",
    "format": "pdf",
    "fileName": "arrays-notes.pdf",
    "mimeType": "application/pdf",
    "byteSize": 1024,
    "generatedAt": "2026-06-28T00:00:00.000Z",
    "metadata": {}
  },
  "download": {
    "fileName": "arrays-notes.pdf",
    "mimeType": "application/pdf",
    "encoding": "base64",
    "content": "..."
  }
}
```

## GET `/api/notes`

Lists generated notes metadata for the authenticated user.

Query:

- `search` optional topic/file search.
- `format` optional `pdf`, `markdown`, or `text`.
- `limit` optional result limit, max `100`.
