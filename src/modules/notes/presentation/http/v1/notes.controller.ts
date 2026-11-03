import { actorOf } from '#modules/shared/presentation/http/v1/actor';

import { mapNote, mapNotePage } from '../../mappers/note.mapper.js';

import type { NotesModule } from '#modules/notes/notes.module';
import type { CreateNoteBody, ListNotesQuery, UpdateNoteBody } from './schemas/notes.schemas.js';
import type { Request, Response } from 'express';

// Express 5 reenvía a `next` los rechazos de handlers async: no hace falta try/catch.
export class NotesController {
  constructor(private useCases: NotesModule['useCases']) {}

  create = async (req: Request, res: Response) => {
    const { title, content } = req.body as CreateNoteBody;
    const note = await this.useCases.createNote.execute({ actor: actorOf(req), title, content });
    res.status(201).json({ data: mapNote(note) });
  };

  list = async (req: Request, res: Response) => {
    const { limit, offset } = req.query as ListNotesQuery;
    const page = await this.useCases.listNotes.execute({ actor: actorOf(req), limit, offset });
    const { items, ...meta } = mapNotePage(page);
    res.status(200).json({ data: items, meta });
  };

  get = async (req: Request, res: Response) => {
    const note = await this.useCases.getNote.execute({
      actor: actorOf(req),
      noteId: req.params.id as string,
    });
    res.status(200).json({ data: mapNote(note) });
  };

  update = async (req: Request, res: Response) => {
    const { title, content } = req.body as UpdateNoteBody;
    const note = await this.useCases.updateNote.execute({
      actor: actorOf(req),
      noteId: req.params.id as string,
      title,
      content,
    });
    res.status(200).json({ data: mapNote(note) });
  };

  delete = async (req: Request, res: Response) => {
    await this.useCases.deleteNote.execute({
      actor: actorOf(req),
      noteId: req.params.id as string,
    });
    res.status(204).send();
  };
}
