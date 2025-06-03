namespace DumpyServer.Models
{
    public class ConnectionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ConnectionString { get; set; } = string.Empty;
        public string DatabaseType { get; set; } = string.Empty;
        public object? Details { get; set; }
    }
} 