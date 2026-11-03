import { randomUUID } from 'node:crypto';

export const newUuid = (): string => randomUUID();
