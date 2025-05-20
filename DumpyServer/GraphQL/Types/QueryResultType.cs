using DumpyServer.Models;
using HotChocolate.Types;

namespace DumpyServer.GraphQL.Types;

public class QueryResultType : ObjectType<QueryResult>
{
    protected override void Configure(IObjectTypeDescriptor<QueryResult> descriptor)
    {
        descriptor.Name("QueryResult");
        descriptor.Description("Represents the result of a database query");

        descriptor.Field(x => x.Columns)
            .Description("The column names from the query result")
            .Type<NonNullType<ListType<NonNullType<StringType>>>>();

        descriptor.Field(x => x.Rows)
            .Description("The rows from the query result")
            .Type<NonNullType<ListType<NonNullType<QueryRowType>>>>();
    }
}

public class QueryRowType : ObjectType<QueryRow>
{
    protected override void Configure(IObjectTypeDescriptor<QueryRow> descriptor)
    {
        descriptor.Name("QueryRow");
        descriptor.Description("Represents a row in a query result");

        descriptor.Field(x => x.Values)
            .Description("The values in this row")
            .Type<NonNullType<ListType<NonNullType<QueryValueType>>>>();
    }
}

public class QueryValueType : ObjectType<QueryValue>
{
    protected override void Configure(IObjectTypeDescriptor<QueryValue> descriptor)
    {
        descriptor.Name("QueryValue");
        descriptor.Description("Represents a value in a query result row");

        descriptor.Field(x => x.Name)
            .Description("The name of the value")
            .Type<NonNullType<StringType>>();

        descriptor.Field(x => x.Value)
            .Description("The value")
            .Type<AnyType>();
    }
} 