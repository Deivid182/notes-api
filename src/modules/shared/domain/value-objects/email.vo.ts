import { ValidationError } from '../error.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOCKED_DOMAINS = new Set<string>([
  // Añadir aquí dominios corporativos bloqueados si aplica
]);

/**
 * Represents an email value object in a TypeScript project.
 * The `Email` class encapsulates the logic for creating and validating email addresses.
 * It ensures that the email format is valid and that the domain is not blocked.
 * The class provides methods for creating an instance, converting to string, and checking equality with another email.
 */

export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      throw new ValidationError('Invalid email format');
    }
    const domain = normalized.split('@')[1];
    if (!domain || BLOCKED_DOMAINS.has(domain)) {
      throw new ValidationError('Email domain not allowed');
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }
  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
