import { ValidationError } from '#modules/shared/domain/error';

const MIN_LENGTH = 8;
/** bcrypt solo considera los primeros 72 bytes: más allá se ignorarían en silencio. */
const MAX_BYTES = 72;

/** Contraseña en claro, válida según la política. Nunca se serializa ni se loguea. */
export class Password {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  static create(raw: string): Password {
    if (raw.length < MIN_LENGTH) {
      throw new ValidationError(`Password must be at least ${MIN_LENGTH} characters long`);
    }
    if (Buffer.byteLength(raw, 'utf8') > MAX_BYTES) {
      throw new ValidationError(`Password cannot exceed ${MAX_BYTES} bytes`);
    }
    return new Password(raw);
  }

  /** Texto plano: solo para entregarlo al `PasswordHasher`. */
  reveal(): string {
    return this.#value;
  }

  toString(): string {
    return '[REDACTED]';
  }
  toJSON(): string {
    return '[REDACTED]';
  }
}
