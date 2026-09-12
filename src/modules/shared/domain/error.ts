/**
 * This file defines custom error classes for domain-specific errors in a TypeScript project.
 * The `DomainError` class is an abstract base class that extends the built-in `Error` class, providing a structure for specific error types.
 * Each subclass represents a different type of domain error,
 * such as validation errors, not found errors, conflict errors, unauthorized errors, and forbidden errors.
 * Each subclass has a unique error code that can be used for error handling and identification.
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
}
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
}
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
}
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
}
