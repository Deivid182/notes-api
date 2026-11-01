import type { NoteContent } from './note-content.vo.js';
import type { NoteTitle } from './note-title.vo.js';

export interface NoteProps {
  id: string;
  ownerId: string;
  title: NoteTitle;
  content: NoteContent;
  createdAt: Date;
  updatedAt: Date;
}

export class Note {
  private constructor(private props: NoteProps) {}

  static create(props: NoteProps): Note {
    return new Note({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get title(): NoteTitle {
    return this.props.title;
  }
  get content(): NoteContent {
    return this.props.content;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(patch: { title?: NoteTitle; content?: NoteContent }, at: Date): void {
    if (patch.title) this.props.title = patch.title;
    if (patch.content) this.props.content = patch.content;
    this.props.updatedAt = at;
  }
}
