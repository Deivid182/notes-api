import type { Container } from '#app/container';
import type { Actor } from '#modules/shared/domain/actor';

export interface GraphQLContext {
  container: Container;
  user: Actor | null;
}

export interface BuildContextDeps {
  container: Container;
}

/** `request` es el `Request` estándar de Fetch (el que entrega Yoga), no el de Express. */
export async function buildContext(
  { container }: BuildContextDeps,
  request: globalThis.Request,
): Promise<GraphQLContext> {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return { container, user: null };
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = await container.modules.auth.tokenService.verifyAccessToken(token);
    return { container, user: { id: payload.sub, role: payload.role } };
  } catch {
    return { container, user: null };
  }
}
