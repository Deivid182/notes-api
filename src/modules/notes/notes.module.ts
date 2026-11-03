import { type SharedContext } from '#modules/shared/infrastructure/shared-context';

import { CreateNoteUseCase } from './application/create-note.use-case.js';
import { DeleteNoteUseCase } from './application/delete-note.use-case.js';
import { GetNoteUseCase } from './application/get-note.use-case.js';
import { ListNotesUseCase } from './application/list-notes.use-case.js';
import { UpdateNoteUseCase } from './application/update-note.use-case.js';
import { type NoteRepository } from './domain/note.repository.js';
import { MongoNoteRepositoryImpl } from './infrastructure/mongodb/mongodb-note.repository.impl.js';
import { PostgresNoteRepositoryImpl } from './infrastructure/postgres/postgres-note.repository.impl.js';
import { SqliteNoteRepositoryImpl } from './infrastructure/sqlite/sqlite-note.repository.impl.js';

export interface NotesModule {
  noteRepository: NoteRepository;
  useCases: {
    createNote: CreateNoteUseCase;
    getNote: GetNoteUseCase;
    listNotes: ListNotesUseCase;
    updateNote: UpdateNoteUseCase;
    deleteNote: DeleteNoteUseCase;
  };
}

export function createNotesModule(shared: SharedContext): NotesModule {
  const { persistence, clock } = shared;
  const noteRepository = buildNoteRepository(persistence);

  return {
    noteRepository,
    useCases: {
      createNote: new CreateNoteUseCase(noteRepository, clock),
      getNote: new GetNoteUseCase(noteRepository),
      listNotes: new ListNotesUseCase(noteRepository),
      updateNote: new UpdateNoteUseCase(noteRepository, clock),
      deleteNote: new DeleteNoteUseCase(noteRepository),
    },
  };
}

function buildNoteRepository(persistence: SharedContext['persistence']): NoteRepository {
  switch (persistence.engine) {
    case 'sqlite':
      return new SqliteNoteRepositoryImpl(persistence.sqlite);
    case 'postgres':
      return new PostgresNoteRepositoryImpl(persistence.postgres);
    case 'mongodb':
      return new MongoNoteRepositoryImpl(persistence.mongodb);
  }
}
