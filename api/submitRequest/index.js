const { TableClient } = require('@azure/data-tables');

const TABLE_NAME = 'SongRequests';

module.exports = async function (context, req) {
    const body = req.body || {};
    const songName = String(body.songName || '').trim();
    const requesterName = String(body.requesterName || '').trim();
    const tipAmount = parseInt(body.tipAmount, 10) || 0;

    if (!songName || !requesterName) {
        context.res = { status: 400, body: 'songName and requesterName are required' };
        return;
    }
    if (isNaN(tipAmount) || tipAmount < 0) {
        context.res = { status: 400, body: 'tipAmount must be a non-negative number' };
        return;
    }
    if (songName.length > 200 || requesterName.length > 100) {
        context.res = { status: 400, body: 'Input too long' };
        return;
    }

    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: 'Storage not configured' };
        return;
    }

    const client = TableClient.fromConnectionString(connectionString, TABLE_NAME);
    try { await client.createTable(); } catch {}

    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
    const rowKey = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await client.createEntity({
        partitionKey: date,
        rowKey,
        songName,
        requesterName,
        tipAmount,
        status: 'pending',
        requestedAt: new Date().toISOString()
    });

    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, rowKey })
    };
};
