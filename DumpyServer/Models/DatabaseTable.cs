namespace DumpyServer.Models;

public class DatabaseTable
{
    public string Name { get; set; } = string.Empty;
    public string Schema { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // TABLE, VIEW, etc.
    public int RowCount { get; set; }
    public DateTime? LastModified { get; set; }
    public List<TableColumn> Columns { get; set; } = new();
}

public class TableColumn
{
    public string Name { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public bool IsNullable { get; set; }
    public bool IsPrimaryKey { get; set; }
    public bool IsForeignKey { get; set; }
    public string? DefaultValue { get; set; }
} 