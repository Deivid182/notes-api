import type { Note } from '#modules/notes/domain/note.entity';

export function toNoteDTO(note: Note) {
  return {
    id: note.id,
    ownerId: note.ownerId,
    title: note.title.toString(),
    content: note.content.toString(),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
