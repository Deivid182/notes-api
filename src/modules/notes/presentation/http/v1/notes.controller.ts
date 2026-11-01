import { actorOf } from '#modules/shared/presentation/http/v1/actor';

import { toNoteDTO } from './dtos/notes.dto.js';

import type { Container } from '#modules/shared/infrastructure/config/container';
import type { NextFunction, Request, Response } from 'express';

export class NotesController {
  constructor(private container: Container) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { createNote } = this.container.modules.notes.useCases;
      const { title, content } = req.body;
      const note = await createNote.execute({ actor: actorOf(req), title, content });
      res.status(201).json({ data: toNoteDTO(note) });
    } catch (e) {
      next(e);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { listNotes } = this.container.modules.notes.useCases;
      const notes = await listNotes.execute({ actor: actorOf(req) });
      res.status(200).json({ data: notes.map(toNoteDTO) });
    } catch (e) {
      next(e);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { getNote } = this.container.modules.notes.useCases;
      const note = await getNote.execute({
        actor: actorOf(req),
        noteId: req.params.id as string,
      });
      res.status(200).json({ data: toNoteDTO(note) });
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { updateNote } = this.container.modules.notes.useCases;
      const { title, content } = req.body;
      const note = await updateNote.execute({
        actor: actorOf(req),
        noteId: req.params.id as string,
        title,
        content,
      });
      res.status(200).json({ data: toNoteDTO(note) });
    } catch (e) {
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deleteNote } = this.container.modules.notes.useCases;
      await deleteNote.execute({ actor: actorOf(req), noteId: req.params.id as string });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  };
}
