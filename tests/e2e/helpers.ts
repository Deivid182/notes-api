import { parseEnv } from '#modules/shared/infrastructure/config/env';

import { createApp } from '../../src/app.js';

const silentLogger = { debug() {}, info() {}, warn() {}, error() {} };

/** Misma composición que producción (`createApp`), sobre SQLite en memoria y sin abrir puertos. */
export async function buildTestApp() {
  const app = await createApp(parseEnv(process.env), { logger: silentLogger });
  return {
    app: app.http,
    yoga: app.graphql.yoga,
    container: app.container,
    close: () => app.stop(),
  };
}

export async function gql(
  yoga: Awaited<ReturnType<typeof buildTestApp>>['yoga'],
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
    data: Record<string, Record<string, unknown>>;
    errors?: Array<{ message: string; extensions: Record<string, unknown> & { code: string } }>;
  };
}
