const { TableClient, odata } = require('@azure/data-tables');

const TABLE_NAME = 'SongRequests';

module.exports = async function (context, req) {
    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: 'Storage not configured' };
        return;
    }

    const client = TableClient.fromConnectionString(connectionString, TABLE_NAME);
    try { await client.createTable(); } catch {}

    const today = new Date().toISOString().slice(0, 10);
    const requests = [];

    const iter = client.listEntities({
        queryOptions: {
            filter: odata`PartitionKey eq ${today} and status ne 'dismissed'`
        }
    });

    for await (const entity of iter) {
        requests.push({
            rowKey: entity.rowKey,
            partitionKey: entity.partitionKey,
            songName: entity.songName,
            requesterName: entity.requesterName,
            tipAmount: entity.tipAmount || 0,
            status: entity.status,
            requestedAt: entity.requestedAt
        });
    }

    requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(requests)
    };
};
