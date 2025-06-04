using Microsoft.AspNetCore.Mvc;
using DumpyServer.Models;
using DumpyServer.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace DumpyServer.Controllers
{
    [ApiController]
    [Route("api/database-connection")]
    [Authorize]
    public class DatabaseConnectionController : ControllerBase
    {
        private readonly IDatabaseConnectionService _dbConnectionService;
        private readonly IUserService _userService;
        private readonly ILogger<DatabaseConnectionController> _logger;
        private readonly IEncryptionService _encryptionService;

        public DatabaseConnectionController(
            IDatabaseConnectionService dbConnectionService,
            IUserService userService,
            ILogger<DatabaseConnectionController> logger,
            IEncryptionService encryptionService)
        {
            _dbConnectionService = dbConnectionService;
            _userService = userService;
            _logger = logger;
            _encryptionService = encryptionService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateConnection([FromBody] DatabaseConnectionRequest request)
        {
            try
            {
                var firebaseId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(firebaseId))
                {
                    return Unauthorized("User ID not found");
                }

                var user = await _userService.GetUserByFirebaseIdAsync(firebaseId);
                if (user == null)
                {
                    return Unauthorized("User not found");
                }

                _logger.LogInformation($"Creating database connection for user {user.DumpyUsersId}");

                var connection = new DatabaseConnection
                {
                    DuUserId = (int)user.DumpyUsersId,
                    ConnectionName = request.ConnectionName,
                    Type = request.DatabaseType,
                    Host = _encryptionService.Decrypt(request.EncryptedHostName),
                    Port = request.PortId,
                    Database = _encryptionService.Decrypt(request.EncryptedServiceName),
                    Username = _encryptionService.Decrypt(request.EncryptedUsername),
                    Password = request.EncryptedPassword,
                    Ssl = request.SslRequired,
                    OptionsJson = request.OptionsJson
                };

                var result = await _dbConnectionService.CreateConnectionAsync(connection);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating database connection");
                return StatusCode(500, "An error occurred while creating the database connection");
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserConnections(int userId)
        {
            try
            {
                _logger.LogInformation("Received request to get connections for user {UserId}", userId);
                _logger.LogInformation("Request headers: {Headers}", 
                    string.Join(", ", Request.Headers.Select(h => $"{h.Key}: {h.Value}")));
                _logger.LogInformation("Request path: {Path}", Request.Path);
                _logger.LogInformation("Request method: {Method}", Request.Method);

                var firebaseId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(firebaseId))
                {
                    _logger.LogWarning("Firebase ID not found in token for user {UserId}", userId);
                    return Unauthorized(new { error = "Firebase ID not found in token" });
                }

                _logger.LogInformation("Found Firebase ID {FirebaseId} in token", firebaseId);

                var user = await _userService.GetUserByFirebaseIdAsync(firebaseId);
                if (user == null)
                {
                    _logger.LogWarning("User not found for Firebase ID {FirebaseId}", firebaseId);
                    return Unauthorized(new { error = "User not found" });
                }

                _logger.LogInformation("Found user {DatabaseUserId} for Firebase ID {FirebaseId}", user.DumpyUsersId, firebaseId);

                if (user.DumpyUsersId != userId)
                {
                    _logger.LogWarning("User {DatabaseUserId} attempted to access connections for user {UserId}", user.DumpyUsersId, userId);
                    return Forbid();
                }

                _logger.LogInformation("Fetching database connections for user {UserId}", userId);
                var connections = await _dbConnectionService.GetUserConnectionsAsync(userId);
                _logger.LogInformation("Found {Count} connections for user {UserId}", connections.Count(), userId);
                
                return Ok(connections);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching database connections for user {UserId}", userId);
                return StatusCode(500, new { error = "An error occurred while fetching database connections", details = ex.Message });
            }
        }

        [HttpDelete("{connectionId}")]
        public async Task<IActionResult> DeleteConnection(int connectionId)
        {
            try
            {
                _logger.LogInformation($"Received delete request for connection {connectionId}");
                
                var firebaseId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(firebaseId))
                {
                    _logger.LogWarning("Firebase ID not found in token");
                    return Unauthorized(new { error = "User ID not found" });
                }

                _logger.LogInformation($"Found Firebase ID: {firebaseId}");

                var user = await _userService.GetUserByFirebaseIdAsync(firebaseId);
                if (user == null)
                {
                    _logger.LogWarning($"User not found for Firebase ID: {firebaseId}");
                    return Unauthorized(new { error = "User not found" });
                }

                _logger.LogInformation($"Found user with ID: {user.DumpyUsersId}");

                await _dbConnectionService.DeleteConnectionAsync(connectionId, (int)user.DumpyUsersId);
                _logger.LogInformation($"Successfully deleted connection {connectionId} for user {user.DumpyUsersId}");
                
                return Ok(new { message = "Connection deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting database connection {connectionId}");
                return StatusCode(500, new { error = "An error occurred while deleting the database connection", details = ex.Message });
            }
        }

        [HttpPut("{connectionId}")]
        public async Task<IActionResult> UpdateConnection(int connectionId, [FromBody] DatabaseConnectionRequest request)
        {
            try
            {
                var firebaseId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(firebaseId))
                {
                    return Unauthorized(new { error = "User ID not found" });
                }

                var user = await _userService.GetUserByFirebaseIdAsync(firebaseId);
                if (user == null)
                {
                    return Unauthorized(new { error = "User not found" });
                }

                _logger.LogInformation($"Updating database connection {connectionId} for user {user.DumpyUsersId}");

                var connection = new DatabaseConnection
                {
                    DbInfoId = connectionId,
                    DuUserId = (int)user.DumpyUsersId,
                    ConnectionName = request.ConnectionName,
                    Type = request.DatabaseType,
                    Host = _encryptionService.Decrypt(request.EncryptedHostName),
                    Port = request.PortId,
                    Database = _encryptionService.Decrypt(request.EncryptedServiceName),
                    Username = _encryptionService.Decrypt(request.EncryptedUsername),
                    Password = request.EncryptedPassword,
                    Ssl = request.SslRequired,
                    OptionsJson = request.OptionsJson
                };

                var result = await _dbConnectionService.UpdateConnectionAsync(connection);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating database connection {connectionId}");
                return StatusCode(500, new { error = "An error occurred while updating the database connection", details = ex.Message });
            }
        }
    }
} 