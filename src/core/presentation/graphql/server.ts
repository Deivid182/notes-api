import { createServer as createNodeServer, type Server as NodeServer } from 'node:http';

import { createYoga, type YogaServerInstance } from 'graphql-yoga';

import { buildContext, type GraphQLContext } from './context.js';
import { schema } from './schema.js';

import type { Container } from '#modules/shared/infrastructure/config/container';

export interface GraphQLHandle {
  yoga: YogaServerInstance<object, GraphQLContext>;
  server: NodeServer;
  port: number;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createGraphQLServer(container: Container, port: number): GraphQLHandle {
  const yoga = createYoga<object, GraphQLContext>({
    schema: schema,
    context: ({ request }) => buildContext({ container }, request),
    graphqlEndpoint: '/graphql',
    landingPage: container.env.NODE_ENV !== 'production',
  });

  const server = createNodeServer(yoga);

  return {
    yoga,
    server,
    port,
    start: () =>
      new Promise<void>((resolve) => {
        server.listen(port, () => resolve());
      }),
    stop: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
