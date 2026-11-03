import { responseTypeDef } from './response.js';

/** Respuesta sin `data` útil (delete, logout): `data` es siempre null. */
export const sharedTypeDefs = /* GraphQL */ `
  ${responseTypeDef('EmptyResponse', 'Boolean')}
`;
