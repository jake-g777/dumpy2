namespace DumpyServer.Models
{
    public class QueryRequest
    {
        public DatabaseConnection Connection { get; set; } = new();
        public string Query { get; set; } = string.Empty;
        public object[]? Parameters { get; set; }
    }
} 