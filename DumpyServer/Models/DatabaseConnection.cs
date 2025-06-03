using System;

namespace DumpyServer.Models
{
    public class DatabaseConnection
    {
        public int DbInfoId { get; set; }
        public int DuUserId { get; set; }
        public string ConnectionName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; }
        public string Database { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool Ssl { get; set; }
        public string OptionsJson { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
