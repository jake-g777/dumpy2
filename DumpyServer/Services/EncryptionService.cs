using System.Security.Cryptography;
using System.Text;

namespace DumpyServer.Services;

public interface IEncryptionService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}

public class EncryptionService : IEncryptionService
{
    private readonly IConfiguration _configuration;
    private readonly byte[] _key;
    private readonly byte[] _iv;

    public EncryptionService(IConfiguration configuration)
    {
        _configuration = configuration;
        var encryptionKey = _configuration["Encryption:Key"] ?? 
            throw new InvalidOperationException("Encryption key not found in configuration.");
        var encryptionIv = _configuration["Encryption:IV"] ?? 
            throw new InvalidOperationException("Encryption IV not found in configuration.");
        
        _key = Convert.FromBase64String(encryptionKey);
        _iv = Convert.FromBase64String(encryptionIv);
    }

    public string Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        
        // Convert to hex string to match frontend format
        return BitConverter.ToString(cipherBytes).Replace("-", "");
    }

    public string Decrypt(string cipherText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;

        using var decryptor = aes.CreateDecryptor();
        
        // Convert from hex string to byte array
        var cipherBytes = new byte[cipherText.Length / 2];
        for (int i = 0; i < cipherBytes.Length; i++)
        {
            cipherBytes[i] = Convert.ToByte(cipherText.Substring(i * 2, 2), 16);
        }
        
        var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
        return Encoding.UTF8.GetString(plainBytes);
    }

    public string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        var hashedInput = HashPassword(password);
        return hashedInput == hashedPassword;
    }
} 