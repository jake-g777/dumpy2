import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = createHttpLink({
  uri: 'http://localhost:5172/graphql',
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:5172/graphql',
  connectionParams: {
    // Add any authentication headers if needed
  },
  retryAttempts: 5,
  connectionAckWaitTimeout: 10000,
  on: {
    connected: () => console.log('WebSocket connected'),
    error: (error) => console.error('WebSocket error:', error),
    closed: () => console.log('WebSocket closed'),
  },
}));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
}); 