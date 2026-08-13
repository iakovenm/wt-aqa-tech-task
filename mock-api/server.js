/**
 * Minimal stand-in for the Users API described in the task.
 *
 * The task specifies two endpoints but no live host, so the suite ships its own
 * reference implementation and Playwright boots it as a `webServer`. Point the
 * suite at a real service with `API_BASE_URL=...` and this file is never used.
 *
 * Endpoints:
 *   GET  /user?user_id=<id>  -> 200 {user_id, username, age} | 400 | 404
 *   POST /user               -> 201 {user_id, username}      | 400
 *   GET  /health             -> 200 {status: 'ok'}
 *
 * Dependency-free on purpose: `node mock-api/server.js` is all it needs.
 */

const http = require('node:http');

const { mockApiPort } = require('../src/config/environment');
const { UsersStore } = require('./users-store');

const store = new UsersStore();

/**
 * Writes a JSON response.
 *
 * @param {http.ServerResponse} res - Response to write to.
 * @param {number} statusCode - HTTP status code.
 * @param {object|null} body - Payload to serialise, or null for an empty body.
 */
function sendJson(res, statusCode, body) {
  if (body === null) {
    res.writeHead(statusCode);
    res.end();
    return;
  }
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

/**
 * Reads and parses a JSON request body.
 *
 * @param {http.IncomingMessage} req - Incoming request.
 * @returns {Promise<{ok: true, value: *}|{ok: false, error: string}>} Parse result.
 */
async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (raw.trim() === '') {
    return { ok: false, error: 'request body is required' };
  }
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, error: 'request body must be valid JSON' };
  }
}

/**
 * GET /user — returns the stored user for the supplied `user_id`.
 *
 * @param {URL} url - Parsed request URL.
 * @param {http.ServerResponse} res - Response to write to.
 */
function handleGetUser(url, res) {
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return sendJson(res, 400, { error: 'user_id query parameter is required' });
  }

  const user = store.find(userId);
  if (!user) {
    return sendJson(res, 404, { error: `user ${userId} was not found` });
  }

  // The contract exposes only these three fields.
  return sendJson(res, 200, { user_id: user.user_id, username: user.username, age: user.age });
}

/**
 * POST /user — creates a user and echoes back its id and username.
 *
 * @param {http.IncomingMessage} req - Incoming request.
 * @param {http.ServerResponse} res - Response to write to.
 */
async function handlePostUser(req, res) {
  const body = await readJsonBody(req);
  if (!body.ok) {
    return sendJson(res, 400, { error: 'invalid request body', details: [body.error] });
  }

  const violations = UsersStore.validateCreatePayload(body.value);
  if (violations.length > 0) {
    return sendJson(res, 400, { error: 'invalid request body', details: violations });
  }

  const user = store.create(body.value);
  return sendJson(res, 201, { user_id: user.user_id, username: user.username });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  try {
    if (url.pathname === '/health' && req.method === 'GET') {
      return sendJson(res, 200, { status: 'ok' });
    }
    if (url.pathname === '/user') {
      if (req.method === 'GET') return handleGetUser(url, res);
      if (req.method === 'POST') return await handlePostUser(req, res);
      return sendJson(res, 405, { error: `${req.method} is not allowed on /user` });
    }
    return sendJson(res, 404, { error: `unknown route ${req.method} ${url.pathname}` });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
});

const port = Number(process.env.PORT || mockApiPort);

server.listen(port, '127.0.0.1', () => {
  console.info(`[mock-api] Users API listening on http://127.0.0.1:${port}`);
});
