import { actorOf } from '#modules/shared/presentation/http/v1/actor';

import { toNoteDTO } from '../../dto/notes.dto.js';

import type { NotesModule } from '#modules/notes/notes.module';
import type { CreateNoteBody, UpdateNoteBody } from './schemas/notes.schemas.js';
import type { Request, Response } from 'express';

// Express 5 reenvía a `next` los rechazos de handlers async: no hace falta try/catch.
export class NotesController {
  constructor(private useCases: NotesModule['useCases']) {}

  create = async (req: Request, res: Response) => {
    const { title, content } = req.body as CreateNoteBody;
    const note = await this.useCases.createNote.execute({ actor: actorOf(req), title, content });
    res.status(201).json({ data: toNoteDTO(note) });
  };

  list = async (req: Request, res: Response) => {
    const notes = await this.useCases.listNotes.execute({ actor: actorOf(req) });
    res.status(200).json({ data: notes.map(toNoteDTO) });
  };

  get = async (req: Request, res: Response) => {
    const note = await this.useCases.getNote.execute({
      actor: actorOf(req),
      noteId: req.params.id as string,
    });
    res.status(200).json({ data: toNoteDTO(note) });
  };

  update = async (req: Request, res: Response) => {
    const { title, content } = req.body as UpdateNoteBody;
    const note = await this.useCases.updateNote.execute({
      actor: actorOf(req),
      noteId: req.params.id as string,
      title,
      content,
    });
    res.status(200).json({ data: toNoteDTO(note) });
  };

  delete = async (req: Request, res: Response) => {
    await this.useCases.deleteNote.execute({
      actor: actorOf(req),
      noteId: req.params.id as string,
    });
    res.status(204).send();
  };
}
