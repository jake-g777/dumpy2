using DumpyServer.Models;

public class ConnectionValidator
{
    public static (bool isValid, string? error) ValidateConnection(DatabaseConnection connection)
    {
        if (string.IsNullOrWhiteSpace(connection.Host))
            return (false, "Host is required");

        if (connection.Port <= 0 || connection.Port > 65535)
            return (false, "Invalid port number");

        if (string.IsNullOrWhiteSpace(connection.Database))
            return (false, "Database name is required");

        if (string.IsNullOrWhiteSpace(connection.Username))
            return (false, "Username is required");

        if (string.IsNullOrWhiteSpace(connection.Password))
            return (false, "Password is required");

        // Validate host format
        if (!Uri.TryCreate($"tcp://{connection.Host}:{connection.Port}", UriKind.Absolute, out _))
            return (false, "Invalid host format");

        return (true, null);
    }
} 