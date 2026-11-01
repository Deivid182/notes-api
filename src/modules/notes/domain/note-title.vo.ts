import { ValidationError } from '#modules/shared/domain/error';

export class NoteTitle {
  private constructor(private readonly value: string) {}

  static create(raw: string): NoteTitle {
    const trimmed = raw.trim();
    if (trimmed.length < 1 || trimmed.length > 150) {
      throw new ValidationError('Note title must be between 1 and 150 characters');
    }
    return new NoteTitle(trimmed);
  }

  /** Rehidrata desde persistencia sin revalidar. */
  static restore(stored: string): NoteTitle {
    return new NoteTitle(stored);
  }

  toString(): string {
    return this.value;
  }
  equals(other: NoteTitle): boolean {
    return this.value === other.value;
  }
}
