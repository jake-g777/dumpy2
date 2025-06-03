using System.ComponentModel.DataAnnotations;

namespace DumpyServer.Models
{
    public class User
    {
        [Key]
        public long DumpyUsersId { get; set; }
        public string FirebaseId { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int UserAccessLevel { get; set; }
        public string? DisplayName { get; set; }
        public string? PhotoUrl { get; set; }
        public bool IsEmailVerified { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProviderId { get; set; }
        public DateTime LastLoginDate { get; set; } = DateTime.UtcNow;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
} 