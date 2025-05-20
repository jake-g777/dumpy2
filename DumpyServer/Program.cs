using DumpyServer.Services;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5174",  // Add your current frontend port
            "http://localhost:5175"   // Keep existing port
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
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

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
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
