using DumpyServer.Models;

namespace DumpyServer.Services
{
    public interface IDatabaseConnectionHandler
    {
        Task<ConnectionResult> TestConnection(DatabaseConnection connection);
        Task<object> ExecuteQuery(DatabaseConnection connection, string query, object[] parameters);
    }
} 