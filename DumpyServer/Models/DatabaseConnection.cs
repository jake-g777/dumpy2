using System.ComponentModel.DataAnnotations;
using MySql.Data.MySqlClient;

namespace DumpyServer.Models
{
    public class DatabaseConnection
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; }
        public string Database { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool Ssl { get; set; } = true;

        // The TestConnection method should be inside the DatabaseConnection class
        public async Task<ConnectionResult> TestConnection()
        {
            try
            {
                string connectionString = "";
                switch (Type.ToLower())
                {
                    case "mysql":
                        connectionString = $"Server={Host};Port={Port};Database={Database};User={Username};Password={Password};SslMode={(Ssl ? "Required" : "None")};";
                        break;
                    case "sqlserver":
                        connectionString = $"Server={Host},{Port};Database={Database};User Id={Username};Password={Password};TrustServerCertificate={Ssl};";
                        break;
                    // ... other cases ...
                }

                using (var connection = new MySqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    return new ConnectionResult { Success = true, Message = "Connection successful" };
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
    }

    public class ConnectionResult
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
        public object? Details { get; set; }
    }
}
