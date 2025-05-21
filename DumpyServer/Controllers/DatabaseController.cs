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

        [HttpPost("databases")]
        public async Task<ActionResult<List<string>>> GetDatabases([FromBody] DatabaseConnection connection)
        {
            try
            {
                var handler = _handlerFactory.GetHandler(connection.Type);
                var databases = await handler.GetDatabases(connection);
                return Ok(databases);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get databases");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("tables")]
        public async Task<ActionResult<List<DatabaseTable>>> GetTables([FromBody] DatabaseConnection connection)
        {
            try
            {
                var handler = _handlerFactory.GetHandler(connection.Type);
                var tables = await handler.GetTables(connection);
                return Ok(tables);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get tables");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("table-names")]
        public async Task<ActionResult<List<string>>> GetTableNames([FromBody] DatabaseConnection connection)
        {
            try
            {
                var handler = _handlerFactory.GetHandler(connection.Type);
                var tableNames = await handler.GetTableNames(connection);
                return Ok(tableNames);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get table names");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("views")]
        public async Task<ActionResult<List<string>>> GetViews([FromBody] DatabaseConnection connection)
        {
            try
            {
                var handler = _handlerFactory.GetHandler(connection.Type);
                var views = await handler.GetViews(connection);
                return Ok(views);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get views");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
} 