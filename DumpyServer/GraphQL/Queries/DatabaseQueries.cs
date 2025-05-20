using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using DumpyServer.Models;
using DumpyServer.Services;
using HotChocolate;
using HotChocolate.Types;
using Microsoft.Extensions.Logging;
using System.Dynamic;

namespace DumpyServer.GraphQL.Queries;

public class DatabaseQueries
{
    private readonly ILogger<DatabaseQueries> _logger;

    public DatabaseQueries(ILogger<DatabaseQueries> logger)
    {
        _logger = logger;
    }

    public async Task<bool> TestConnection(
        DatabaseConnection connection,
        [Service] IDatabaseConnectionManager connectionManager)
    {
        return await connectionManager.TestConnectionAsync(connection);
    }

    public async Task<QueryResult> ExecuteQuery(
        DatabaseConnection connection,
        string query,
        Dictionary<string, object> parameters,
        [Service] IDatabaseConnectionManager connectionManager)
    {
        var results = await connectionManager.ExecuteQueryAsync(connection, query, parameters.Values.ToArray());
        var queryResult = new QueryResult();
        
        if (results != null)
        {
            var resultList = results.ToList();
            if (resultList.Any())
            {
                var firstRow = (IDictionary<string, object>)resultList.First();
                queryResult.Columns = firstRow.Keys.ToArray();
                queryResult.Rows = resultList.Select(row => new QueryRow 
                { 
                    Values = ((IDictionary<string, object>)row)
                        .Select(kv => new QueryValue { Name = kv.Key, Value = kv.Value })
                        .ToList()
                }).ToList();
            }
        }
        
        return queryResult;
    }

    public async Task<List<DatabaseTable>> GetDatabaseTables(
        [Service] IDatabaseConnectionManager connectionManager,
        string connectionId)
    {
        try
        {
            _logger.LogInformation("Fetching tables for connection {ConnectionId}", connectionId);
            return await connectionManager.GetDatabaseTablesAsync(connectionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching tables for connection {ConnectionId}", connectionId);
            throw;
        }
    }
} 