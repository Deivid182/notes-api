import type { Note } from '#modules/notes/domain/note.entity';
import type { Page } from '#modules/shared/domain/pagination';

export interface MappedNote {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface MappedNotePage {
  items: MappedNote[];
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function mapNote(note: Note): MappedNote {
  return {
    id: note.id,
    ownerId: note.ownerId,
    title: note.title.value,
    content: note.content.value,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function mapNotePage(page: Page<Note>): MappedNotePage {
  return {
    items: page.items.map(mapNote),
    limit: page.limit,
    offset: page.offset,
    hasMore: page.hasMore,
  };
}
