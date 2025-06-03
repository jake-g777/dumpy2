using Microsoft.Data.SqlClient;
using Npgsql;
using MySql.Data.MySqlClient;
using Microsoft.Extensions.Caching.Memory;
using System.Data;
using Dapper;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DumpyServer.Models;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;

namespace DumpyServer.Services;

public interface IDatabaseConnectionManager
{
    Task<bool> TestConnectionAsync(DatabaseConnection connection);
    Task<IDbConnection> GetConnectionAsync(DatabaseConnection connection);
    Task<IEnumerable<dynamic>> ExecuteQueryAsync(DatabaseConnection connection, string query, object[] parameters);
    Task CloseConnection(DatabaseConnection connection);
    Task<bool> ExecuteQueryAsync(DatabaseConnection connection, string query, Dictionary<string, object>? parameters = null);
    Task<List<DatabaseTable>> GetDatabaseTablesAsync(string connectionId);
}

public class DatabaseConnectionManager : IDatabaseConnectionManager
{
    private readonly IMemoryCache _connectionCache;
    private readonly ILogger<DatabaseConnectionManager> _logger;
    private readonly IEncryptionService _encryptionService;
    private readonly ILoggingService _loggingService;
    private readonly Dictionary<string, DatabaseConnection> _connections;

    public DatabaseConnectionManager(
        IMemoryCache connectionCache,
        ILogger<DatabaseConnectionManager> logger,
        IEncryptionService encryptionService,
        ILoggingService loggingService)
    {
        _connectionCache = connectionCache;
        _logger = logger;
        _encryptionService = encryptionService;
        _loggingService = loggingService;
        _connections = new Dictionary<string, DatabaseConnection>();
    }

    public async Task<bool> TestConnectionAsync(DatabaseConnection connection)
    {
        try
        {
            _logger.LogInformation(
                "Testing connection to {Type} database at {Host}:{Port}/{Database}",
                connection.Type, connection.Host, connection.Port, connection.Database);

            using var conn = await GetConnectionAsync(connection);
            await Task.Run(() => conn.Open());
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing connection to database");
            return false;
        }
    }

    public async Task<IDbConnection> GetConnectionAsync(DatabaseConnection connection)
    {
        var cacheKey = GetConnectionCacheKey(connection);
        
        if (_connectionCache.TryGetValue(cacheKey, out IDbConnection? cachedConnection))
        {
            return cachedConnection!;
        }

        var connectionString = GetConnectionString(connection);
        IDbConnection newConnection = connection.Type.ToLower() switch
        {
            "sqlserver" => new SqlConnection(connectionString),
            "postgresql" => new NpgsqlConnection(connectionString),
            "mysql" => new MySqlConnection(connectionString),
            "oracle" => new OracleConnection(connectionString),
            _ => throw new ArgumentException($"Unsupported database type: {connection.Type}")
        };

        var cacheEntryOptions = new MemoryCacheEntryOptions()
            .SetSlidingExpiration(TimeSpan.FromMinutes(30))
            .RegisterPostEvictionCallback(async (key, value, reason, state) =>
            {
                if (value is IDbConnection conn)
                {
                    await Task.Run(() => conn.Dispose());
                }
            });

        await Task.Run(() => _connectionCache.Set(cacheKey, newConnection, cacheEntryOptions));
        return newConnection;
    }

    private string GetConnectionString(DatabaseConnection connection)
    {
        var encryptedPassword = _encryptionService.Encrypt(connection.Password);
        
        return connection.Type.ToLower() switch
        {
            "mysql" => new MySqlConnectionStringBuilder
            {
                Server = connection.Host,
                Port = (uint)connection.Port,
                Database = connection.Database,
                UserID = connection.Username,
                Password = encryptedPassword,
                SslMode = MySqlSslMode.Disabled
            }.ConnectionString,

            "sqlserver" => new SqlConnectionStringBuilder
            {
                DataSource = $"{connection.Host},{connection.Port}",
                InitialCatalog = connection.Database,
                UserID = connection.Username,
                Password = encryptedPassword,
                TrustServerCertificate = connection.Ssl
            }.ConnectionString,

            "oracle" => new OracleConnectionStringBuilder
            {
                DataSource = $"(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={connection.Host})(PORT={connection.Port}))(CONNECT_DATA=(SERVICE_NAME={connection.Database})))",
                UserID = connection.Username,
                Password = encryptedPassword
            }.ConnectionString,

            _ => throw new ArgumentException($"Unsupported database type: {connection.Type}")
        };
    }

    public async Task<IEnumerable<dynamic>> ExecuteQueryAsync(DatabaseConnection connection, string query, object[] parameters)
    {
        using var conn = await GetConnectionAsync(connection);
        try
        {
            var paramObject = new DynamicParameters();
            for (int i = 0; i < parameters.Length; i++)
            {
                paramObject.Add($"@p{i}", parameters[i]);
            }
            return await conn.QueryAsync(query, paramObject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing query: {Query}", query);
            throw;
        }
    }

    public async Task CloseConnection(DatabaseConnection connection)
    {
        var cacheKey = GetConnectionCacheKey(connection);
        if (_connectionCache.TryGetValue(cacheKey, out IDbConnection? conn))
        {
            _connectionCache.Remove(cacheKey);
            if (conn != null)
            {
                await Task.Run(() => {
                    conn.Close();
                    conn.Dispose();
                });
            }
        }
        else
        {
            _logger.LogError("Connection not found in cache");
        }
    }

    private string GetConnectionCacheKey(DatabaseConnection connection)
    {
        return $"{connection.Type}:{connection.Host}:{connection.Database}:{connection.Username}";
    }

    public async Task<bool> ExecuteQueryAsync(DatabaseConnection connection, string query, Dictionary<string, object>? parameters = null)
    {
        try
        {
            _logger.LogInformation(
                "Executing query for {Type} database at {Host}:{Port}/{Database}",
                connection.Type, connection.Host, connection.Port, connection.Database);

            using var conn = await GetConnectionAsync(connection);
            var paramObject = new DynamicParameters(parameters);
            await conn.QueryAsync(query, paramObject);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing query");
            return false;
        }
    }

    public async Task<List<DatabaseTable>> GetDatabaseTablesAsync(string connectionId)
    {
        try
        {
            if (!_connections.TryGetValue(connectionId, out var connection))
            {
                throw new System.Collections.Generic.KeyNotFoundException($"Connection {connectionId} not found");
            }

            _logger.LogInformation(
                "Fetching tables for {Type} database at {Host}:{Port}/{Database}",
                connection.Type, connection.Host, connection.Port, connection.Database);

            using var conn = await GetConnectionAsync(connection);
            var tables = new List<DatabaseTable>();

            switch (connection.Type.ToLower())
            {
                case "sqlserver":
                    var sqlServerTables = await conn.QueryAsync<DatabaseTable>(@"
                        SELECT 
                            t.name as Name,
                            s.name as Schema,
                            p.rows as RowCount,
                            CAST(ROUND(((SUM(a.total_pages) * 8) / 1024.00), 2) AS FLOAT) as SizeInMB
                        FROM sys.tables t
                        INNER JOIN sys.indexes i ON t.object_id = i.object_id
                        INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
                        INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
                        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
                        WHERE i.index_id <= 1
                        GROUP BY t.name, s.name, p.rows
                        ORDER BY t.name");
                    tables.AddRange(sqlServerTables);
                    break;

                case "postgresql":
                    var postgresTables = await conn.QueryAsync<DatabaseTable>(@"
                        SELECT 
                            table_name as Name,
                            table_schema as Schema,
                            (SELECT count(*) FROM information_schema.tables WHERE table_schema = t.table_schema AND table_name = t.table_name) as RowCount,
                            pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as SizeInMB
                        FROM information_schema.tables t
                        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
                        ORDER BY table_name");
                    tables.AddRange(postgresTables);
                    break;

                case "mysql":
                    var mysqlTables = await conn.QueryAsync<DatabaseTable>(@"
                        SELECT 
                            table_name as Name,
                            table_schema as Schema,
                            table_rows as RowCount,
                            ROUND((data_length + index_length) / 1024 / 1024, 2) as SizeInMB
                        FROM information_schema.tables
                        WHERE table_schema = @Database
                        ORDER BY table_name", new { connection.Database });
                    tables.AddRange(mysqlTables);
                    break;
            }

            return tables;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching database tables");
            throw;
        }
    }
}
