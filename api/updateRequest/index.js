const { TableClient } = require('@azure/data-tables');

const TABLE_NAME = 'SongRequests';
const ALLOWED_STATUSES = ['played', 'dismissed'];

module.exports = async function (context, req) {
    const password = req.headers['x-queue-password'];
    const expectedPassword = process.env.API_PASSWORD;

    if (!expectedPassword || password !== expectedPassword) {
        context.res = { status: 401, body: 'Unauthorized' };
        return;
    }

    const body = req.body || {};
    const { rowKey, partitionKey, status } = body;

    if (!rowKey || !partitionKey || !ALLOWED_STATUSES.includes(status)) {
        context.res = { status: 400, body: 'rowKey, partitionKey, and status (played|dismissed) required' };
        return;
    }

    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: 'Storage not configured' };
        return;
    }

    const client = TableClient.fromConnectionString(connectionString, TABLE_NAME);

    await client.updateEntity({ partitionKey, rowKey, status }, 'Merge');

    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
    };
};
