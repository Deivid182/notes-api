import { NoteContent } from '#modules/notes/domain/note-content.vo';
import { NoteTitle } from '#modules/notes/domain/note-title.vo';
import { Note } from '#modules/notes/domain/note.entity';
import { type NoteRepository } from '#modules/notes/domain/note.repository';

import type { Collection, Db } from 'mongodb';

interface NoteDoc {
  _id: string;
  ownerId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoNoteRepositoryImpl implements NoteRepository {
  private collection: Collection<NoteDoc>;

  constructor(db: Db) {
    this.collection = db.collection<NoteDoc>('notes');
  }

  async findById(id: string): Promise<Note | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.toEntity(doc) : null;
  }

  async findAllByOwner(ownerId: string): Promise<Note[]> {
    const docs = await this.collection.find({ ownerId }).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => this.toEntity(d));
  }

  async findAll(): Promise<Note[]> {
    const docs = await this.collection.find().sort({ createdAt: -1 }).toArray();
    return docs.map((d) => this.toEntity(d));
  }

  async save(note: Note): Promise<void> {
    const doc: NoteDoc = {
      _id: note.id,
      ownerId: note.ownerId,
      title: note.title.toString(),
      content: note.content.toString(),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
    await this.collection.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }

  private toEntity(doc: NoteDoc): Note {
    return Note.create({
      id: doc._id,
      ownerId: doc.ownerId,
      title: NoteTitle.create(doc.title),
      content: NoteContent.create(doc.content),
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }
}
