namespace DumpyServer.Models
{
    public class ConnectionStatus
    {
        public string Status { get; set; } = string.Empty;
        public DateTime LastTested { get; set; } = DateTime.UtcNow;
        public string? Error { get; set; }
        public ConnectionMetrics? Metrics { get; set; }
    }

    public class ConnectionMetrics
    {
        public double ResponseTime { get; set; }
        public int ActiveQueries { get; set; }
    }
} 