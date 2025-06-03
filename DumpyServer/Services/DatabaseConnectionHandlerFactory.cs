using System;
using System.Collections.Generic;
using DumpyServer.Models;

namespace DumpyServer.Services
{
    public class DatabaseConnectionHandlerFactory
    {
        private readonly Dictionary<string, IDatabaseConnectionHandler> _handlers;

        public DatabaseConnectionHandlerFactory()
        {
            _handlers = new Dictionary<string, IDatabaseConnectionHandler>
            {
                { "mysql", new MySqlConnectionHandler() },
                { "sqlserver", new SqlServerConnectionHandler() },
                { "oracle", new OracleConnectionHandler() }
                // Add more handlers as needed
            };
        }

        public IDatabaseConnectionHandler GetHandler(string databaseType)
        {
            if (_handlers.TryGetValue(databaseType.ToLower(), out var handler))
            {
                return handler;
            }
            throw new ArgumentException($"Unsupported database type: {databaseType}");
        }
    }
} 