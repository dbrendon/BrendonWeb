const { TableClient } = require('@azure/data-tables');

const TABLE_NAME = 'C2CSongs';

module.exports = async function (context, req) {
    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: 'Storage not configured' };
        return;
    }

    const client = TableClient.fromConnectionString(connectionString, TABLE_NAME);
    try { await client.createTable(); } catch {}

    try {
        const entity = await client.getEntity('songs', 'list');
        const songs = JSON.parse(entity.data || '[]');
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            body: JSON.stringify(songs)
        };
    } catch (e) {
        if (e.statusCode === 404) {
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
                body: '[]'
            };
        } else {
            throw e;
        }
    }
};
