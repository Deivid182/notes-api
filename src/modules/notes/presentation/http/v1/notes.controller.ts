import { actorOf } from '#modules/shared/presentation/http/v1/actor';
import { sendData, sendList, sendNoContent } from '#modules/shared/presentation/http/v1/response';

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
    sendData(res, mapNote(note), 201);
  };

  list = async (req: Request, res: Response) => {
    const { limit, offset } = req.query as ListNotesQuery;
    const page = await this.useCases.listNotes.execute({ actor: actorOf(req), limit, offset });
    const { items, ...meta } = mapNotePage(page);
    sendList(res, items, meta);
  };

  get = async (req: Request, res: Response) => {
    const note = await this.useCases.getNote.execute({
      actor: actorOf(req),
      noteId: req.params.id as string,
    });
    sendData(res, mapNote(note));
  };

  update = async (req: Request, res: Response) => {
    const { title, content } = req.body as UpdateNoteBody;
    const note = await this.useCases.updateNote.execute({
      actor: actorOf(req),
      noteId: req.params.id as string,
      title,
      content,
    });
    sendData(res, mapNote(note));
  };

  delete = async (req: Request, res: Response) => {
    await this.useCases.deleteNote.execute({
      actor: actorOf(req),
      noteId: req.params.id as string,
    });
    sendNoContent(res);
  };
}
