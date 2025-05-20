using System;
using System.Threading;
using System.Threading.Tasks;
using DumpyServer.Models;
using DumpyServer.Services;
using HotChocolate;
using HotChocolate.Subscriptions;
using HotChocolate.Types;
using Microsoft.Extensions.Logging;

namespace DumpyServer.GraphQL.Subscriptions
{
    public class DatabaseSubscriptions
    {
        private readonly IDatabaseConnectionManager _connectionManager;
        private readonly ITopicEventSender _eventSender;
        private readonly ILogger<DatabaseSubscriptions> _logger;

        public DatabaseSubscriptions(
            IDatabaseConnectionManager connectionManager,
            ITopicEventSender eventSender,
            ILogger<DatabaseSubscriptions> logger)
        {
            _connectionManager = connectionManager;
            _eventSender = eventSender;
            _logger = logger;
        }

        [Subscribe]
        public async Task<ConnectionStatus> OnConnectionStatusChange(
            string connectionId,
            [EventMessage] ConnectionStatus status)
        {
            _logger.LogInformation(
                "Connection status changed for {ConnectionId}: {Status}",
                connectionId, status.Status);

            await Task.Delay(1); // Ensure async operation
            return status;
        }

        // Method to publish connection status updates
        public async Task PublishConnectionStatus(string connectionId, ConnectionStatus status)
        {
            await _eventSender.SendAsync(
                $"OnConnectionStatusChange_{connectionId}",
                status);
        }
    }
} 