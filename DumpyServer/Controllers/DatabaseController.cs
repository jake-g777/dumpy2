using Microsoft.AspNetCore.Mvc;
using DumpyServer.Models;
using DumpyServer.Services;

namespace DumpyServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseController : ControllerBase
    {
        private readonly ILogger<DatabaseController> _logger;
        private readonly DatabaseConnectionHandlerFactory _handlerFactory;

        public DatabaseController(
            ILogger<DatabaseController> logger,
            DatabaseConnectionHandlerFactory handlerFactory)
        {
            _logger = logger;
            _handlerFactory = handlerFactory;
        }

        [HttpPost("test")]
        public async Task<ActionResult<ConnectionResult>> TestConnection([FromBody] DatabaseConnection connection)
        {
            try
            {
                var handler = _handlerFactory.GetHandler(connection.Type);
                var result = await handler.TestConnection(connection);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ConnectionResult 
                { 
                    Success = false, 
                    Message = ex.Message 
                });
            }
        }

        [HttpPost("query")]
        public async Task<ActionResult> ExecuteQuery([FromBody] QueryRequest request)
        {
            try
            {
                var handler = _handlerFactory.GetHandler(request.Connection.Type);
                var result = await handler.ExecuteQuery(
                    request.Connection, 
                    request.Query, 
                    request.Parameters ?? Array.Empty<object>());
                
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Query execution failed");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
} 