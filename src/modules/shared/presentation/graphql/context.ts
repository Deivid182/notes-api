import type { Container } from '#modules/shared/infrastructure/config/container';

export interface AuthUser {
  id: string;
  role: string;
}

export interface GraphQLContext {
  container: Container;
  user: AuthUser | null;
}

export interface BuildContextDeps {
  container: Container;
}

export async function buildContext(
  { container }: BuildContextDeps,
  request: Request,
): Promise<GraphQLContext> {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return { container, user: null };
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = await container.tokenService.verifyAccessToken(token);
    return { container, user: { id: payload.sub, role: payload.role } };
  } catch {
    return { container, user: null };
  }
}
