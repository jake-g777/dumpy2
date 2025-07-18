using DumpyServer.Services;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Oracle.ManagedDataAccess.Client;
using System.Data;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Oracle database connection
builder.Services.AddScoped<IDbConnection>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("DefaultConnection");
    return new OracleConnection(connectionString);
});

// Register UserService
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<IDatabaseConnectionService, DatabaseConnectionService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5176"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/dumpy-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Register services
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IDatabaseConnectionManager, DatabaseConnectionManager>();
builder.Services.AddSingleton<IEncryptionService, EncryptionService>();
builder.Services.AddSingleton<ILoggingService, LoggingService>();
builder.Services.AddSingleton<DatabaseConnectionHandlerFactory>();

// Add authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Authority = "https://securetoken.google.com/dumpy-1b8e1";
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = "https://securetoken.google.com/dumpy-1b8e1",
        ValidateAudience = true,
        ValidAudience = "dumpy-1b8e1",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Processing authentication request for path: {Path}", context.Request.Path);
            
            if (context.Request.Headers.ContainsKey("Authorization"))
            {
                var authHeader = context.Request.Headers["Authorization"].ToString();
                logger.LogInformation("Authorization header found: {Header}", authHeader.Substring(0, Math.Min(20, authHeader.Length)) + "...");
                
                if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = authHeader.Substring("Bearer ".Length).Trim();
                    logger.LogInformation("Token extracted successfully");
                }
                else
                {
                    logger.LogWarning("Authorization header does not start with 'Bearer '");
                }
            }
            else
            {
                logger.LogWarning("No Authorization header found in request");
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError("Authentication failed: {Exception}", context.Exception);
            logger.LogError("Request path: {Path}", context.Request.Path);
            logger.LogError("Request headers: {Headers}", 
                string.Join(", ", context.Request.Headers.Select(h => $"{h.Key}: {h.Value}")));
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Token validated successfully for user: {UserId}", context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            logger.LogInformation("Request path: {Path}", context.Request.Path);
            return Task.CompletedTask;
        }
    };
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Move CORS before other middleware
app.UseCors("AllowFrontend");

// Only use HTTPS redirection in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Request/Response models
// public record DatabaseConnection(
//     string Type,
//     string Host,
//     string Port,
//     string Database,
//     string Username,
//     string Password,
//     bool Ssl = true
// );
