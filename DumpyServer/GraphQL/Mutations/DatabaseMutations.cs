using System;
using System.Threading.Tasks;
using DumpyServer.Models;
using DumpyServer.Services;
using HotChocolate;
using HotChocolate.Types;
using Microsoft.Extensions.Logging;

namespace DumpyServer.GraphQL.Mutations
{
    public class DatabaseMutations
    {
        private readonly ILogger<DatabaseMutations> _logger;

        public DatabaseMutations(ILogger<DatabaseMutations> logger)
        {
            _logger = logger;
        }

        public async Task<ConnectionResult> TestConnection(
            [Service] IDatabaseConnectionManager connectionManager,
            string type,
            DatabaseConnection connection)
        {
            try
            {
                _logger.LogInformation(
                    "Received connection test request for {Type} database at {Host}:{Port}/{Database} (SSL: {Ssl})",
                    type, connection.Host, connection.Port, connection.Database, connection.Ssl);

                var success = await connectionManager.TestConnectionAsync(connection);
                
                if (success)
                {
                    _logger.LogInformation(
                        "Connection test successful for {Type} database at {Host}:{Port}/{Database}",
                        type, connection.Host, connection.Port, connection.Database);
                    
                    return new ConnectionResult 
                    { 
                        Success = true,
                        Message = "Connection successful",
                        Details = $"Successfully connected to {type} database at {connection.Host}:{connection.Port}/{connection.Database}"
                    };
                }
                else
                {
                    _logger.LogWarning(
                        "Connection test failed for {Type} database at {Host}:{Port}/{Database}",
                        type, connection.Host, connection.Port, connection.Database);
                    
                    return new ConnectionResult 
                    { 
                        Success = false,
                        Message = "Connection failed",
                        Details = $"Failed to connect to {type} database at {connection.Host}:{connection.Port}/{connection.Database}. Please check your connection details."
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error testing connection to {Type} database at {Host}:{Port}/{Database}. Error: {ErrorMessage}",
                    type, connection.Host, connection.Port, connection.Database, ex.Message);
                
                return new ConnectionResult 
                { 
                    Success = false,
                    Message = ex.Message,
                    Details = $"Error details: {ex.InnerException?.Message ?? ex.Message}\nStack trace: {ex.StackTrace}"
                };
            }
        }
    }
} 