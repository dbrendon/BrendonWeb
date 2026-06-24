const { TableClient } = require('@azure/data-tables');

const TABLE_NAME = 'C2CSongs';

module.exports = async function (context, req) {
    const password = req.headers['x-api-password'];
    const expectedPassword = process.env.API_PASSWORD;

    if (!expectedPassword || password !== expectedPassword) {
        context.res = { status: 401, body: 'Unauthorized' };
        return;
    }

    const body = req.body;
    if (!Array.isArray(body)) {
        context.res = { status: 400, body: 'Body must be a JSON array of {title, artist}' };
        return;
    }

    const songs = body
        .map(s => ({ title: String(s.title || '').trim(), artist: String(s.artist || '').trim() }))
        .filter(s => s.title);

    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: 'Storage not configured' };
        return;
    }

    const client = TableClient.fromConnectionString(connectionString, TABLE_NAME);
    try { await client.createTable(); } catch {}

    await client.upsertEntity(
        { partitionKey: 'songs', rowKey: 'list', data: JSON.stringify(songs) },
        'Replace'
    );

    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, count: songs.length })
    };
};
