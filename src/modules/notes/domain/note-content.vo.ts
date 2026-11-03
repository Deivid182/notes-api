import { ValidationError } from '#modules/shared/domain/error';

export class NoteContent {
  private constructor(readonly value: string) {}

  static create(raw: string): NoteContent {
    if (raw.length > 10_000) {
      throw new ValidationError('Note content cannot exceed 10.000 characters');
    }
    return new NoteContent(raw);
  }

  /** Rehidrata desde persistencia sin revalidar. */
  static restore(stored: string): NoteContent {
    return new NoteContent(stored);
  }

  equals(other: NoteContent): boolean {
    return this.value === other.value;
  }
}
