using DumpyServer.Models;
using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;
using System.Data;
using Microsoft.Extensions.Configuration;

namespace DumpyServer.Services
{
    public class DatabaseConnectionService : IDatabaseConnectionService
    {
        private readonly string _connectionString;
        private readonly ILogger<DatabaseConnectionService> _logger;

        public DatabaseConnectionService(IConfiguration configuration, ILogger<DatabaseConnectionService> logger)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new ArgumentNullException(nameof(configuration), "DefaultConnection string is missing");
            _logger = logger;
        }

        public async Task<DatabaseConnection> CreateConnectionAsync(DatabaseConnection connection)
        {
            try
            {
                using (var conn = new OracleConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    var cmd = new OracleCommand(
                        @"INSERT INTO DB_INFO (
                            DU_USER_ID, CONNECTION_NAME, DATABASE_TYPE, 
                            HOST_NAME, PORT_ID, SERVICE_NAME, 
                            USERNAME, PASSWORD, SSL_REQUIRED, 
                            OPTIONS_JSON
                        ) VALUES (
                            :userId, :connectionName, :databaseType,
                            :hostName, :portId, :serviceName,
                            :username, :password, :sslRequired,
                            :optionsJson
                        ) RETURNING DB_INFO_ID INTO :id", conn);

                    cmd.Parameters.Add(":userId", OracleDbType.Int32).Value = connection.DuUserId;
                    cmd.Parameters.Add(":connectionName", OracleDbType.Varchar2).Value = connection.ConnectionName;
                    cmd.Parameters.Add(":databaseType", OracleDbType.Varchar2).Value = connection.Type;
                    cmd.Parameters.Add(":hostName", OracleDbType.Varchar2).Value = connection.Host;
                    cmd.Parameters.Add(":portId", OracleDbType.Int32).Value = connection.Port;
                    cmd.Parameters.Add(":serviceName", OracleDbType.Varchar2).Value = connection.Database;
                    cmd.Parameters.Add(":username", OracleDbType.Varchar2).Value = connection.Username;
                    
                    // The password is already encrypted and in hex format from the frontend
                    cmd.Parameters.Add(":password", OracleDbType.Raw).Value = Convert.FromHexString(connection.Password);
                    
                    cmd.Parameters.Add(":sslRequired", OracleDbType.Char).Value = connection.Ssl ? 'Y' : 'N';
                    cmd.Parameters.Add(":optionsJson", OracleDbType.Clob).Value = connection.OptionsJson ?? (object)DBNull.Value;

                    var idParam = new OracleParameter(":id", OracleDbType.Int32);
                    idParam.Direction = ParameterDirection.Output;
                    cmd.Parameters.Add(idParam);

                    await cmd.ExecuteNonQueryAsync();

                    connection.DbInfoId = ((OracleDecimal)idParam.Value).ToInt32();
                    return connection;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating database connection");
                throw;
            }
        }

        public async Task<IEnumerable<DatabaseConnection>> GetUserConnectionsAsync(int userId)
        {
            try
            {
                using (var conn = new OracleConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    var cmd = new OracleCommand(
                        @"SELECT * FROM DB_INFO WHERE DU_USER_ID = :userId", conn);
                    cmd.Parameters.Add(":userId", OracleDbType.Int32).Value = userId;

                    var connections = new List<DatabaseConnection>();
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            connections.Add(new DatabaseConnection
                            {
                                DbInfoId = reader.GetInt32(reader.GetOrdinal("DB_INFO_ID")),
                                DuUserId = reader.GetInt32(reader.GetOrdinal("DU_USER_ID")),
                                ConnectionName = reader.GetString(reader.GetOrdinal("CONNECTION_NAME")),
                                Type = reader.GetString(reader.GetOrdinal("DATABASE_TYPE")),
                                Host = reader.GetString(reader.GetOrdinal("HOST_NAME")),
                                Port = reader.GetInt32(reader.GetOrdinal("PORT_ID")),
                                Database = reader.GetString(reader.GetOrdinal("SERVICE_NAME")),
                                Username = reader.GetString(reader.GetOrdinal("USERNAME")),
                                Password = BitConverter.ToString((byte[])reader.GetValue(reader.GetOrdinal("PASSWORD"))).Replace("-", ""),
                                Ssl = reader.GetString(reader.GetOrdinal("SSL_REQUIRED"))[0] == 'Y',
                                OptionsJson = reader.IsDBNull(reader.GetOrdinal("OPTIONS_JSON")) 
                                    ? string.Empty 
                                    : reader.GetString(reader.GetOrdinal("OPTIONS_JSON")),
                                CreatedAt = reader.GetDateTime(reader.GetOrdinal("CREATED_AT")),
                                UpdatedAt = reader.GetDateTime(reader.GetOrdinal("UPDATED_AT"))
                            });
                        }
                    }

                    return connections;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching database connections for user {userId}");
                throw;
            }
        }

        public async Task DeleteConnectionAsync(int connectionId, int userId)
        {
            try
            {
                using (var conn = new OracleConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    var cmd = new OracleCommand(
                        @"DELETE FROM DB_INFO 
                          WHERE DB_INFO_ID = :connectionId 
                          AND DU_USER_ID = :userId", conn);

                    cmd.Parameters.Add(":connectionId", OracleDbType.Int32).Value = connectionId;
                    cmd.Parameters.Add(":userId", OracleDbType.Int32).Value = userId;

                    var result = await cmd.ExecuteNonQueryAsync();
                    if (result == 0)
                    {
                        throw new Exception("Connection not found or user not authorized");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting database connection {connectionId}");
                throw;
            }
        }

        public async Task<DatabaseConnection> UpdateConnectionAsync(DatabaseConnection connection)
        {
            try
            {
                using (var conn = new OracleConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    var cmd = new OracleCommand(
                        @"UPDATE DB_INFO 
                          SET CONNECTION_NAME = :connectionName,
                              DATABASE_TYPE = :databaseType,
                              HOST_NAME = :hostName,
                              PORT_ID = :portId,
                              SERVICE_NAME = :serviceName,
                              USERNAME = :username,
                              PASSWORD = :password,
                              SSL_REQUIRED = :sslRequired,
                              OPTIONS_JSON = :optionsJson,
                              UPDATED_AT = SYSDATE
                          WHERE DB_INFO_ID = :connectionId 
                          AND DU_USER_ID = :userId", conn);

                    cmd.Parameters.Add(":connectionName", OracleDbType.Varchar2).Value = connection.ConnectionName;
                    cmd.Parameters.Add(":databaseType", OracleDbType.Varchar2).Value = connection.Type;
                    cmd.Parameters.Add(":hostName", OracleDbType.Varchar2).Value = connection.Host;
                    cmd.Parameters.Add(":portId", OracleDbType.Int32).Value = connection.Port;
                    cmd.Parameters.Add(":serviceName", OracleDbType.Varchar2).Value = connection.Database;
                    cmd.Parameters.Add(":username", OracleDbType.Varchar2).Value = connection.Username;
                    cmd.Parameters.Add(":password", OracleDbType.Raw).Value = Convert.FromHexString(connection.Password);
                    cmd.Parameters.Add(":sslRequired", OracleDbType.Char).Value = connection.Ssl ? 'Y' : 'N';
                    cmd.Parameters.Add(":optionsJson", OracleDbType.Clob).Value = connection.OptionsJson ?? (object)DBNull.Value;
                    cmd.Parameters.Add(":connectionId", OracleDbType.Int32).Value = connection.DbInfoId;
                    cmd.Parameters.Add(":userId", OracleDbType.Int32).Value = connection.DuUserId;

                    var result = await cmd.ExecuteNonQueryAsync();
                    if (result == 0)
                    {
                        throw new Exception("Connection not found or user not authorized");
                    }

                    return connection;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating database connection {connection.DbInfoId}");
                throw;
            }
        }
    }
} 