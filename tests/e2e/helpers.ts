import { createYoga } from 'graphql-yoga';

import {
  buildContainer,
  buildSharedContext,
} from '#modules/shared/infrastructure/config/container';
import { loadEnv } from '#modules/shared/infrastructure/config/env';
import { connectSqlite } from '#modules/shared/infrastructure/persistence/sqlite/connection';
import { runSqliteMigrations } from '#modules/shared/infrastructure/persistence/sqlite/migrate';
import { buildContext, type GraphQLContext } from '#modules/shared/presentation/graphql/context';
import { schema } from '#modules/shared/presentation/graphql/schema';
import { createHttpServer } from '#modules/shared/presentation/http/v1/index';

export function buildTestApp() {
  const env = loadEnv();
  const db = connectSqlite(':memory:');
  const shared = buildSharedContext({
    env,
    persistence: { sqlite: db },
    logger: { debug() {}, info() {}, warn() {}, error() {} },
  });
  runSqliteMigrations(db, shared.logger);
  const container = buildContainer({ shared });
  const app = createHttpServer(container);
  const yoga = createYoga<object, GraphQLContext>({
    schema,
    context: ({ request }) => buildContext({ container }, request),
  });
  return { app, yoga, container, close: () => db.close() };
}

export async function gql(
  yoga: ReturnType<typeof buildTestApp>['yoga'],
  query: string,
  token?: string,
) {
  const res = await yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query }),
  });
  return (await res.json()) as {
    data: Record<string, Record<string, unknown> & { accessToken: string; id: string }> &
      Record<string, unknown>;
    errors?: Array<{ extensions: { code: string } }>;
  };
}
