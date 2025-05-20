using System;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using DumpyServer.Models;
using DumpyServer.Services;
using System.Collections.Generic;

namespace DumpyServer.Services
{
    public class SqlServerConnectionHandler : IDatabaseConnectionHandler
    {
        public async Task<ConnectionResult> TestConnection(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Server={connection.Host},{connection.Port};Database={connection.Database};User Id={connection.Username};Password={connection.Password};TrustServerCertificate={connection.Ssl};";
                
                using (var conn = new SqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    return new ConnectionResult { Success = true, Message = "SQL Server connection successful" };
                }
            }
            catch (Exception ex)
            {
                return new ConnectionResult 
                { 
                    Success = false, 
                    Message = ex.Message,
                    Details = ex.ToString()
                };
            }
        }

        public async Task<object> ExecuteQuery(DatabaseConnection connection, string query, object[] parameters)
        {
            try
            {
                string connectionString = $"Server={connection.Host},{connection.Port};Database={connection.Database};User Id={connection.Username};Password={connection.Password};TrustServerCertificate={connection.Ssl};";
                
                using (var conn = new SqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    using var cmd = new SqlCommand(query, conn);
                    
                    // Add parameters if any
                    if (parameters != null)
                    {
                        for (int i = 0; i < parameters.Length; i++)
                        {
                            cmd.Parameters.AddWithValue($"@p{i}", parameters[i]);
                        }
                    }

                    using var reader = await cmd.ExecuteReaderAsync();
                    var results = new List<Dictionary<string, object>>();
                    
                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            row[reader.GetName(i)] = reader.GetValue(i);
                        }
                        results.Add(row);
                    }
                    
                    return results;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Query execution failed: {ex.Message}", ex);
            }
        }
    }
} 