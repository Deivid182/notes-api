import type { Note } from '#modules/notes/domain/note.entity';
import type { Page } from '#modules/shared/domain/pagination';

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

export function toNotePageDTO(page: Page<Note>) {
  return {
    items: page.items.map(toNoteDTO),
    limit: page.limit,
    offset: page.offset,
    hasMore: page.hasMore,
  };
}
