module.exports = async function (context, req) {
    const password = req.headers['x-queue-password'];
    const expectedPassword = process.env.QUEUE_PASSWORD;

    if (!expectedPassword || password !== expectedPassword) {
        context.res = { status: 401, body: 'Unauthorized' };
        return;
    }

    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true })
    };
};
