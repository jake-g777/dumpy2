using HotChocolate.Types;
using DumpyServer.Models;

namespace DumpyServer.GraphQL.Types;

public class ConnectionResultType : ObjectType<ConnectionResult>
{
    protected override void Configure(IObjectTypeDescriptor<ConnectionResult> descriptor)
    {
        descriptor.Field(x => x.Success).Description("Whether the connection was successful");
        descriptor.Field(x => x.Message).Description("A message describing the connection result");
        descriptor.Field(x => x.Details).Description("Additional details about the connection result");
    }
} 