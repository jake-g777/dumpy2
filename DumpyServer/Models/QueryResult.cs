namespace DumpyServer.Models;

public class QueryResult
{
    public string[] Columns { get; set; } = Array.Empty<string>();
    public List<QueryRow> Rows { get; set; } = new();
}

public class QueryRow
{
    public List<QueryValue> Values { get; set; } = new();
}

public class QueryValue
{
    public string Name { get; set; } = string.Empty;
    public object? Value { get; set; }
} 