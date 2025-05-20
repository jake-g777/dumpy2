using DumpyServer.Services;
using DumpyServer.GraphQL.Mutations;
using DumpyServer.GraphQL.Subscriptions;
using DumpyServer.GraphQL.Types;
using DumpyServer.GraphQL.Queries;
using HotChocolate.AspNetCore;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;
using Swashbuckle.AspNetCore.Swagger;
using DumpyServer.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5175") // Frontend URL
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/dumpy-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Configure rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", options =>
    {
        options.PermitLimit = 100;
        options.Window = TimeSpan.FromMinutes(1);
        options.QueueLimit = 2;
    });
});

// Register services
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IDatabaseConnectionManager, DatabaseConnectionManager>();
builder.Services.AddSingleton<IEncryptionService, EncryptionService>();
builder.Services.AddSingleton<ILoggingService, LoggingService>();

// Configure GraphQL
builder.Services
    .AddGraphQLServer()
    .AddQueryType<DatabaseQueries>()
    .AddMutationType<DatabaseMutations>()
    .AddSubscriptionType<DatabaseSubscriptions>()
    .AddType<DatabaseConnectionType>()
    .AddType<DatabaseConnectionInputType>()
    .AddType<ConnectionResultType>()
    .AddType<QueryResultType>()
    .AddInMemorySubscriptions();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(); // Add CORS middleware
app.UseAuthorization();
app.UseRateLimiter();

// Configure GraphQL endpoints
app.MapGraphQL()
   .WithOptions(new GraphQLServerOptions
   {
       Tool = { Enable = true },
       EnableSchemaRequests = true,
       EnableGetRequests = true,
       EnableMultipartRequests = true
   });

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

public record QueryRequest(
    DatabaseConnection Connection,
    string Query,
    object[] Params
);
