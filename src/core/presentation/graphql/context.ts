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
  void request;
  return { container, user: null };
}
