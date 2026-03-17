const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, 'db.json');

const readDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    return { tests: [], rooms: [], submissions: [] };
  }

  const content = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(content);
};

const writeDb = (db) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
};

const createId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const generateRoomCode = (rooms) => {
  let code = '';
  do {
    code = Math.floor(10000 + Math.random() * 90000).toString();
  } while (rooms.some((room) => room.code === code));
  return code;
};

const sendJson = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    return sendJson(res, 400, { message: 'Bad request' });
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && pathname === '/api/tests') {
      const db = readDb();
      return sendJson(res, 200, db.tests);
    }

    if (req.method === 'GET' && pathname.startsWith('/api/tests/')) {
      const id = pathname.replace('/api/tests/', '');
      const db = readDb();
      const test = db.tests.find((item) => item.id === id) || null;
      return sendJson(res, 200, test);
    }

    if (req.method === 'POST' && pathname === '/api/tests') {
      const body = await readBody(req);
      const db = readDb();
      const test = {
        id: createId(),
        ...body,
        createdAt: new Date().toISOString()
      };
      db.tests.push(test);
      writeDb(db);
      return sendJson(res, 201, { id: test.id });
    }

    if (req.method === 'POST' && pathname === '/api/rooms') {
      const body = await readBody(req);
      const db = readDb();
      if (!body.testId) {
        return sendJson(res, 400, { message: 'testId is required' });
      }
      const room = {
        id: createId(),
        code: generateRoomCode(db.rooms),
        active: false,
        created: new Date().toISOString(),
        testId: body.testId
      };
      db.rooms.push(room);
      writeDb(db);
      return sendJson(res, 201, { id: room.id, code: room.code });
    }

    if (req.method === 'PATCH' && pathname.endsWith('/activate') && pathname.startsWith('/api/rooms/')) {
      const roomId = pathname.replace('/api/rooms/', '').replace('/activate', '');
      const db = readDb();
      const room = db.rooms.find((item) => item.id === roomId);
      if (!room) {
        return sendJson(res, 404, { message: 'Room not found' });
      }
      room.active = true;
      writeDb(db);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/rooms/code/')) {
      const code = pathname.replace('/api/rooms/code/', '');
      const db = readDb();
      const room = db.rooms.find((item) => item.code === code && item.active) || null;
      return sendJson(res, 200, room);
    }

    if (req.method === 'GET' && pathname === '/api/rooms') {
      const db = readDb();
      return sendJson(res, 200, db.rooms);
    }

    if (req.method === 'GET' && pathname.startsWith('/api/rooms/')) {
      const id = pathname.replace('/api/rooms/', '');
      const db = readDb();
      const room = db.rooms.find((item) => item.id === id) || null;
      return sendJson(res, 200, room);
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/rooms/')) {
      const id = pathname.replace('/api/rooms/', '');
      const db = readDb();
      db.rooms = db.rooms.filter((item) => item.id !== id);
      writeDb(db);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && pathname === '/api/submissions') {
      const body = await readBody(req);
      const db = readDb();
      const submission = {
        id: createId(),
        ...body,
        timestamp: new Date().toISOString()
      };
      db.submissions.push(submission);
      writeDb(db);
      return sendJson(res, 201, { id: submission.id });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/submissions/room/')) {
      const roomId = pathname.replace('/api/submissions/room/', '');
      const db = readDb();
      const submissions = db.submissions.filter((item) => item.roomId === roomId);
      return sendJson(res, 200, submissions);
    }

    return sendJson(res, 404, { message: 'Not found' });
  } catch (error) {
    return sendJson(res, 500, { message: error.message || 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Quiz backend started on http://localhost:${PORT}`);
});
