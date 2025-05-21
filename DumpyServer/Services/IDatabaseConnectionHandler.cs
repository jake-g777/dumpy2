using DumpyServer.Models;

namespace DumpyServer.Services
{
    public interface IDatabaseConnectionHandler
    {
        Task<ConnectionResult> TestConnection(DatabaseConnection connection);
        Task<object> ExecuteQuery(DatabaseConnection connection, string query, object[] parameters);
        Task<List<string>> GetTableNames(DatabaseConnection connection);
        Task<List<string>> GetTables(DatabaseConnection connection);
        Task<List<string>> GetViews(DatabaseConnection connection);
        Task<List<string>> GetDatabases(DatabaseConnection connection);
    }
} 