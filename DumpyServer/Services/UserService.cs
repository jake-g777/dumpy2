using System;
using System.Threading.Tasks;
using DumpyServer.Models;
using Microsoft.Extensions.Logging;
using Dapper;
using System.Data;

namespace DumpyServer.Services
{
    public interface IUserService
    {
        Task<User> CreateOrUpdateUserAsync(User user);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByFirebaseIdAsync(string firebaseId);
    }

    public class UserService : IUserService
    {
        private readonly IDbConnection _db;
        private readonly ILogger<UserService> _logger;

        public UserService(IDbConnection db, ILogger<UserService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<User> CreateOrUpdateUserAsync(User user)
        {
            try
            {
                _logger.LogInformation("Attempting to create/update user: {Email}", user.UserEmail);
                
                var existingUser = await GetUserByEmailAsync(user.UserEmail);
                if (existingUser != null)
                {
                    _logger.LogInformation("Updating existing user: {Email}", user.UserEmail);
                    // Update existing user
                    const string updateQuery = @"
                        UPDATE DUMPY_USERS 
                        SET DISPLAY_NAME = :DisplayName,
                            PHOTO_URL = :PhotoUrl,
                            IS_EMAIL_VERIFIED = :IsEmailVerified,
                            PHONE_NUMBER = :PhoneNumber,
                            PROVIDER_ID = :ProviderId,
                            LAST_LOGIN_DATE = :LastLoginDate,
                            USER_ACCESS_LEVEL = :UserAccessLevel
                        WHERE USER_EMAIL = :UserEmail";

                    await _db.ExecuteAsync(updateQuery, new { 
                        user.DisplayName,
                        user.PhotoUrl,
                        IsEmailVerified = user.IsEmailVerified ? 1 : 0,
                        user.PhoneNumber,
                        user.ProviderId,
                        LastLoginDate = DateTime.UtcNow,
                        user.UserAccessLevel,
                        user.UserEmail 
                    });
                    return existingUser;
                }
                else
                {
                    _logger.LogInformation("Creating new user: {Email}", user.UserEmail);
                    // Create new user
                    const string insertQuery = @"
                        INSERT INTO DUMPY_USERS (
                            FIREBASE_ID, 
                            USER_EMAIL, 
                            USER_ACCESS_LEVEL,
                            DISPLAY_NAME,
                            PHOTO_URL,
                            IS_EMAIL_VERIFIED,
                            PHONE_NUMBER,
                            PROVIDER_ID,
                            CREATED_DATE,
                            LAST_LOGIN_DATE
                        )
                        VALUES (
                            :FirebaseId, 
                            :UserEmail, 
                            :UserAccessLevel,
                            :DisplayName,
                            :PhotoUrl,
                            :IsEmailVerified,
                            :PhoneNumber,
                            :ProviderId,
                            :CreatedDate,
                            :LastLoginDate
                        )
                        RETURNING DUMPY_USERS_ID INTO :DumpyUsersId";

                    var parameters = new DynamicParameters();
                    parameters.Add(":FirebaseId", user.FirebaseId);
                    parameters.Add(":UserEmail", user.UserEmail);
                    parameters.Add(":UserAccessLevel", user.UserAccessLevel);
                    parameters.Add(":DisplayName", user.DisplayName);
                    parameters.Add(":PhotoUrl", user.PhotoUrl);
                    parameters.Add(":IsEmailVerified", user.IsEmailVerified ? 1 : 0);
                    parameters.Add(":PhoneNumber", user.PhoneNumber);
                    parameters.Add(":ProviderId", user.ProviderId);
                    parameters.Add(":CreatedDate", DateTime.UtcNow);
                    parameters.Add(":LastLoginDate", DateTime.UtcNow);
                    parameters.Add(":DumpyUsersId", dbType: DbType.Int64, direction: ParameterDirection.Output);

                    try
                    {
                        await _db.ExecuteAsync(insertQuery, parameters);
                        var newId = parameters.Get<long>(":DumpyUsersId");
                        user.DumpyUsersId = newId;
                        _logger.LogInformation("Successfully created new user with ID: {Id}", newId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error executing insert query for user: {Email}", user.UserEmail);
                        throw;
                    }
                }

                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating/updating user: {Email}", user.UserEmail);
                throw;
            }
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            try
            {
                const string query = "SELECT * FROM DUMPY_USERS WHERE USER_EMAIL = :UserEmail";
                var user = await _db.QueryFirstOrDefaultAsync<User>(query, new { UserEmail = email });
                if (user != null)
                {
                    user.IsEmailVerified = Convert.ToInt32(user.IsEmailVerified) == 1;
                }
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by email: {Email}", email);
                throw;
            }
        }

        public async Task<User?> GetUserByFirebaseIdAsync(string firebaseId)
        {
            try
            {
                _logger.LogInformation("Executing query to get user by Firebase ID: {FirebaseId}", firebaseId);
                
                const string query = @"
                    SELECT 
                        DUMPY_USERS_ID as DumpyUsersId,
                        FIREBASE_ID as FirebaseId,
                        USER_EMAIL as UserEmail,
                        USER_ACCESS_LEVEL as UserAccessLevel,
                        DISPLAY_NAME as DisplayName,
                        PHOTO_URL as PhotoUrl,
                        IS_EMAIL_VERIFIED as IsEmailVerified,
                        PHONE_NUMBER as PhoneNumber,
                        PROVIDER_ID as ProviderId,
                        CREATED_DATE as CreatedDate,
                        LAST_LOGIN_DATE as LastLoginDate
                    FROM DUMPY_USERS 
                    WHERE FIREBASE_ID = :FirebaseId";
                    
                var user = await _db.QueryFirstOrDefaultAsync<User>(query, new { FirebaseId = firebaseId });
                
                if (user != null)
                {
                    _logger.LogInformation("Found user with ID {UserId} for Firebase ID: {FirebaseId}", user.DumpyUsersId, firebaseId);
                    user.IsEmailVerified = Convert.ToInt32(user.IsEmailVerified) == 1;
                }
                else
                {
                    _logger.LogWarning("No user found for Firebase ID: {FirebaseId}", firebaseId);
                }
                
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by Firebase ID: {FirebaseId}", firebaseId);
                throw;
            }
        }
    }
} 