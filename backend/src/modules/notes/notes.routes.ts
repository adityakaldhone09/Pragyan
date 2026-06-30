import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import { generateNote, listNotes } from './notes.controller';
import { generateNoteSchema, listNotesQuerySchema } from './notes.validators';

const router = Router();

router.post('/generate', authenticate, validate(generateNoteSchema), generateNote);
router.get('/', authenticate, validate(listNotesQuerySchema, 'query'), listNotes);

export default router;
