using System;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;
using DumpyServer.Models;
using DumpyServer.Services;
using System.Collections.Generic;

namespace DumpyServer.Services
{
    public class MySqlConnectionHandler : IDatabaseConnectionHandler
    {
        public async Task<ConnectionResult> TestConnection(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Server={connection.Host};Port={connection.Port};Database={connection.Database};User={connection.Username};Password={connection.Password};SslMode={(connection.Ssl ? "Required" : "None")};AllowPublicKeyRetrieval=true;";
                
                using (var conn = new MySqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    return new ConnectionResult { Success = true, Message = "MySQL connection successful" };
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
                string connectionString = $"Server={connection.Host};Port={connection.Port};Database={connection.Database};User={connection.Username};Password={connection.Password};SslMode={(connection.Ssl ? "Required" : "None")};";
                
                using (var conn = new MySqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    using var cmd = new MySqlCommand(query, conn);
                    
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