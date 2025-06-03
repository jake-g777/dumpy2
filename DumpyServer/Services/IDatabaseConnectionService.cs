using DumpyServer.Models;

namespace DumpyServer.Services
{
    public interface IDatabaseConnectionService
    {
        Task<DatabaseConnection> CreateConnectionAsync(DatabaseConnection connection);
        Task<IEnumerable<DatabaseConnection>> GetUserConnectionsAsync(int userId);
        Task DeleteConnectionAsync(int connectionId, int userId);
    }
} 