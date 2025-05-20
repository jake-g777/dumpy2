import { useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';

const CONNECTION_STATUS_SUBSCRIPTION = gql`
  subscription OnConnectionStatusChange($connectionId: String!) {
    onConnectionStatusChange(connectionId: $connectionId) {
      status
      lastTested
      error
      metrics {
        responseTime
        activeQueries
      }
    }
  }
`;

export function useConnectionStatus(connectionId: string) {
  const { data, loading, error } = useSubscription(
    CONNECTION_STATUS_SUBSCRIPTION,
    { 
      variables: { connectionId },
      skip: !connectionId,
      onError: (error) => {
        console.error('Subscription error:', error);
      }
    }
  );

  return {
    status: data?.onConnectionStatusChange,
    loading,
    error
  };
} 