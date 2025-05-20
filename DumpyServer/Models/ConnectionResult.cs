namespace DumpyServer.Models;

public class ConnectionResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
} 