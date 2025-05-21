using System;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;
using DumpyServer.Models;
using DumpyServer.Services;
using System.Collections.Generic;
using Dapper;

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
                string connectionString = $"Server={connection.Host};Port={connection.Port};Database={connection.Database};User={connection.Username};Password={connection.Password};SslMode={(connection.Ssl ? "Required" : "None")};AllowPublicKeyRetrieval=true;";
                
                using (var conn = new MySqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    var result = await conn.QueryAsync(query, parameters);
                    return result;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Query execution failed: {ex.Message}");
            }
        }

        public async Task<List<string>> GetTables(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Server={connection.Host};Port={connection.Port};Database={connection.Database};User={connection.Username};Password={connection.Password};SslMode={(connection.Ssl ? "Required" : "None")};AllowPublicKeyRetrieval=true;";
                
                using (var conn = new MySqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    var tables = await conn.QueryAsync<string>("SHOW TABLES");
                    return tables.ToList();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get table names: {ex.Message}");
            }
        }
        public async Task<List<string>> GetTableNames(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Server={connection.Host};Port={connection.Port};Database={connection.Database};User={connection.Username};Password={connection.Password};SslMode={(connection.Ssl ? "Required" : "None")};AllowPublicKeyRetrieval=true;";
                using (var conn = new MySqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    var tables = await conn.QueryAsync<string>(
                        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = @Database",
                        new { connection.Database }
                    );
                    return tables.ToList();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get table names: {ex.Message}");
            }
        }
        public async Task<List<string>> GetViews(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Server={connection.Host};Port={connection.Port};Database={connection.Database};User={connection.Username};Password={connection.Password};SslMode={(connection.Ssl ? "Required" : "None")};AllowPublicKeyRetrieval=true;";
                using (var conn = new MySqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    var views = await conn.QueryAsync<string>(
                        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = @Database",
                        new { connection.Database }
                    );
                    return views.ToList();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get view names: {ex.Message}");
            }
        }
        public async Task<List<string>> GetDatabases(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Server={connection.Host};Port={connection.Port};User={connection.Username};Password={connection.Password};SslMode={(connection.Ssl ? "Required" : "None")};AllowPublicKeyRetrieval=true;";
                using (var conn = new MySqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    var databases = await conn.QueryAsync<string>("SHOW DATABASES");
                    return databases.ToList();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get databases: {ex.Message}");
            }
        }
    }
} 