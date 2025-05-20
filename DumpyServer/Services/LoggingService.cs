using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Text.Json;
using Dapper;
using Serilog;

namespace DumpyServer.Services
{
    public interface ILoggingService
    {
        Task LogDatabaseOperationAsync(
            string operation,
            string databaseType,
            string databaseName,
            bool success,
            string? error = null,
            Dictionary<string, object>? additionalData = null);
    }

    public class LoggingService : ILoggingService
    {
        private readonly ILogger<LoggingService> _logger;
        private readonly IDbConnection _loggingDb;

        public LoggingService(
            ILogger<LoggingService> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _loggingDb = new SqlConnection(configuration.GetConnectionString("LoggingDb"));
        }

        public async Task LogDatabaseOperationAsync(
            string operation,
            string databaseType,
            string databaseName,
            bool success,
            string? error = null,
            Dictionary<string, object>? additionalData = null)
        {
            try
            {
                var logEntry = new
                {
                    Timestamp = DateTime.UtcNow,
                    Operation = operation,
                    DatabaseType = databaseType,
                    DatabaseName = databaseName,
                    Success = success,
                    Error = error,
                    AdditionalData = additionalData != null ? JsonSerializer.Serialize(additionalData) : null
                };

                // Log to structured logging system (e.g., Serilog)
                _logger.LogInformation(
                    "Database operation: {Operation} on {DatabaseType}:{DatabaseName} - Success: {Success}",
                    operation, databaseType, databaseName, success);

                if (!success)
                {
                    _logger.LogError("Database operation failed: {Error}", error);
                }

                // Log to database
                await _loggingDb.ExecuteAsync(@"
                    INSERT INTO DatabaseOperationLogs 
                    (Timestamp, Operation, DatabaseType, DatabaseName, Success, Error, AdditionalData)
                    VALUES (@Timestamp, @Operation, @DatabaseType, @DatabaseName, @Success, @Error, @AdditionalData)",
                    logEntry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log database operation");
            }
        }

        public void LogInformation(string message)
        {
            _logger.LogInformation(message);
        }

        public void LogWarning(string message)
        {
            _logger.LogWarning(message);
        }

        public void LogError(string message, Exception? exception = null)
        {
            if (exception != null)
                _logger.LogError(exception, message);
            else
                _logger.LogError(message);
        }

        public void LogDebug(string message)
        {
            _logger.LogDebug(message);
        }
    }
} 