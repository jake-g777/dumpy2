namespace DumpyServer.Models
{
    public class DatabaseConnectionRequest
    {
        public string ConnectionName { get; set; } = string.Empty;
        public string DatabaseType { get; set; } = string.Empty;
        public string EncryptedHostName { get; set; } = string.Empty;
        public int PortId { get; set; }
        public string EncryptedServiceName { get; set; } = string.Empty;
        public string EncryptedUsername { get; set; } = string.Empty;
        public string EncryptedPassword { get; set; } = string.Empty;
        public bool SslRequired { get; set; }
        public string OptionsJson { get; set; } = string.Empty;
    }
} 