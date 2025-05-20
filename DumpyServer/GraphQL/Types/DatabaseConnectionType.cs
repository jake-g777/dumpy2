using HotChocolate.Types;
using DumpyServer.Models;

namespace DumpyServer.GraphQL.Types;

public class DatabaseConnectionType : ObjectType<DatabaseConnection>
{
    protected override void Configure(IObjectTypeDescriptor<DatabaseConnection> descriptor)
    {
        descriptor.Field(x => x.Password).Ignore(); // Don't expose password in schema
        descriptor.Field(x => x.Type).Description("Database type (mysql, postgresql, etc.)");
        descriptor.Field(x => x.Host).Description("Database host address");
        descriptor.Field(x => x.Port).Description("Database port number");
        descriptor.Field(x => x.Database).Description("Database name");
        descriptor.Field(x => x.Username).Description("Database username");
        descriptor.Field(x => x.Ssl).Description("Whether to use SSL for the connection");
    }
}

public class DatabaseConnectionInputType : InputObjectType<DatabaseConnection>
{
    protected override void Configure(IInputObjectTypeDescriptor<DatabaseConnection> descriptor)
    {
        descriptor.Name("DatabaseConnectionInput");
        descriptor.Field(x => x.Type).Type<NonNullType<StringType>>().Description("Database type (mysql, postgresql, etc.)");
        descriptor.Field(x => x.Host).Type<NonNullType<StringType>>().Description("Database host address");
        descriptor.Field(x => x.Port).Type<NonNullType<IntType>>().Description("Database port number");
        descriptor.Field(x => x.Database).Type<NonNullType<StringType>>().Description("Database name");
        descriptor.Field(x => x.Username).Type<NonNullType<StringType>>().Description("Database username");
        descriptor.Field(x => x.Password).Type<NonNullType<StringType>>().Description("Database password");
        descriptor.Field(x => x.Ssl).Type<BooleanType>().DefaultValue(true).Description("Whether to use SSL for the connection");
    }
} 