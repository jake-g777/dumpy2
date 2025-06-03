using System;
using System.Threading.Tasks;
using Oracle.ManagedDataAccess.Client;
using DumpyServer.Models;
using DumpyServer.Services;
using System.Collections.Generic;
using Dapper;

namespace DumpyServer.Services
{
    public class OracleConnectionHandler : IDatabaseConnectionHandler
    {
        public async Task<ConnectionResult> TestConnection(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={connection.Host})(PORT={connection.Port}))(CONNECT_DATA=(SERVICE_NAME={connection.Database})));User Id={connection.Username};Password={connection.Password};";
                
                using (var conn = new OracleConnection(connectionString))
                {
                    await conn.OpenAsync();
                    return new ConnectionResult { Success = true, Message = "Oracle connection successful" };
                }
            }
            catch (Exception ex)
            {
                return new ConnectionResult 
                { 
                    Success = false, 
                    Message = ex.Message,
                    Details = ex.ToString()
                };
            }
        }

        public async Task<object> ExecuteQuery(DatabaseConnection connection, string query, object[] parameters)
        {
            try
            {
                string connectionString = $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={connection.Host})(PORT={connection.Port}))(CONNECT_DATA=(SERVICE_NAME={connection.Database})));User Id={connection.Username};Password={connection.Password};";
                
                using (var conn = new OracleConnection(connectionString))
                {
                    await conn.OpenAsync();
                    var result = await conn.QueryAsync(query, parameters);
                    return result;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Query execution failed: {ex.Message}");
            }
        }

        public async Task<List<string>> GetTables(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={connection.Host})(PORT={connection.Port}))(CONNECT_DATA=(SERVICE_NAME={connection.Database})));User Id={connection.Username};Password={connection.Password};";
                
                using (var conn = new OracleConnection(connectionString))
                {
                    await conn.OpenAsync();
                    var tables = await conn.QueryAsync<string>(
                        "SELECT TABLE_NAME FROM USER_TABLES ORDER BY TABLE_NAME"
                    );
                    return tables.ToList();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get table names: {ex.Message}");
            }
        }

        public async Task<List<string>> GetTableNames(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={connection.Host})(PORT={connection.Port}))(CONNECT_DATA=(SERVICE_NAME={connection.Database})));User Id={connection.Username};Password={connection.Password};";
                using (var conn = new OracleConnection(connectionString))
                {
                    await conn.OpenAsync();
                    var tables = await conn.QueryAsync<string>(
                        "SELECT TABLE_NAME FROM USER_TABLES ORDER BY TABLE_NAME"
                    );
                    return tables.ToList();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get table names: {ex.Message}");
            }
        }

        public async Task<List<string>> GetViews(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={connection.Host})(PORT={connection.Port}))(CONNECT_DATA=(SERVICE_NAME={connection.Database})));User Id={connection.Username};Password={connection.Password};";
                using (var conn = new OracleConnection(connectionString))
                {
                    await conn.OpenAsync();
                    var views = await conn.QueryAsync<string>(
                        "SELECT VIEW_NAME FROM USER_VIEWS ORDER BY VIEW_NAME"
                    );
                    return views.ToList();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get view names: {ex.Message}");
            }
        }

        public async Task<List<string>> GetDatabases(DatabaseConnection connection)
        {
            try
            {
                string connectionString = $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={connection.Host})(PORT={connection.Port}))(CONNECT_DATA=(SERVICE_NAME={connection.Database})));User Id={connection.Username};Password={connection.Password};";
                using (var conn = new OracleConnection(connectionString))
                {
                    await conn.OpenAsync();
                    // In Oracle, we get the list of schemas (which are similar to databases in other systems)
                    var schemas = await conn.QueryAsync<string>(
                        "SELECT DISTINCT OWNER FROM ALL_TABLES WHERE OWNER NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DIP', 'ORACLE_OCM', 'APPQOSSYS', 'DBSNMP', 'CTXSYS', 'XDB', 'ANONYMOUS', 'EXFSYS', 'MDDATA', 'DBSFWUSER', 'REMOTE_SCHEDULER_AGENT', 'SI_INFORMTN_SCHEMA', 'ORDDATA', 'ORDSYS', 'MDSYS', 'OLAPSYS', 'OWBSYS', 'APEX_040000', 'APEX_PUBLIC_USER', 'FLOWS_FILES', 'MDDATA', 'ORACLE_OCM', 'SPATIAL_CSW_ADMIN_USR', 'SPATIAL_WFS_ADMIN_USR', 'HR', 'OE', 'PM', 'IX', 'SH', 'BI', 'SCOTT') ORDER BY OWNER"
                    );
                    return schemas.ToList();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get databases: {ex.Message}");
            }
        }
    }
} 