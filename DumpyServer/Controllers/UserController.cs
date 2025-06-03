using Microsoft.AspNetCore.Mvc;
using DumpyServer.Models;
using DumpyServer.Services;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;

namespace DumpyServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("AllowFrontend")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet("by-firebase-id")]
        public async Task<IActionResult> GetUserByFirebaseId([FromQuery] string firebaseId)
        {
            try
            {
                _logger.LogInformation("Getting user by Firebase ID: {FirebaseId}", firebaseId);
                
                if (string.IsNullOrEmpty(firebaseId))
                {
                    _logger.LogWarning("Firebase ID is null or empty");
                    return BadRequest(new { error = "Firebase ID is required" });
                }

                var user = await _userService.GetUserByFirebaseIdAsync(firebaseId);
                if (user == null)
                {
                    _logger.LogWarning("User not found for Firebase ID: {FirebaseId}", firebaseId);
                    return NotFound(new { error = "User not found" });
                }

                _logger.LogInformation("Found user for Firebase ID: {FirebaseId}", firebaseId);
                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by Firebase ID: {FirebaseId}", firebaseId);
                return StatusCode(500, new { error = "An error occurred while processing your request", details = ex.Message });
            }
        }

        [HttpPost("google-signin")]
        public async Task<IActionResult> HandleGoogleSignIn([FromBody] User user)
        {
            try
            {
                _logger.LogInformation("Received Google sign-in request for user: {Email}", user.UserEmail);
                var savedUser = await _userService.CreateOrUpdateUserAsync(user);
                return Ok(savedUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling Google sign-in for user: {Email}", user.UserEmail);
                return StatusCode(500, new { error = "An error occurred while processing your request", details = ex.Message });
            }
        }

        [HttpGet("by-email/{email}")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            try
            {
                var user = await _userService.GetUserByEmailAsync(email);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }
                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by email: {Email}", email);
                return StatusCode(500, new { error = "An error occurred while processing your request", details = ex.Message });
            }
        }
    }
} 