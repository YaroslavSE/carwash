const jwt = require('jsonwebtoken');
require('dotenv').config();

const UPSTASH_URL   = process.env.UPSTASH_REDIS_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_TOKEN;

// Запит до Upstash REST API
async function redisCommand(...args) {
  const res = await fetch(`${UPSTASH_URL}/${args.join('/')}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  return res.json();
}

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES,
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES,
  });
  return { accessToken, refreshToken };
}

// Зберігаємо refresh токен в Upstash (TTL 7 днів)
async function saveRefreshToken(clientId, token) {
  await redisCommand('SET', `refresh:${clientId}`, token, 'EX', 604800);
}

async function getRefreshToken(clientId) {
  const data = await redisCommand('GET', `refresh:${clientId}`);
  return data.result;
}

async function deleteRefreshToken(clientId) {
  await redisCommand('DEL', `refresh:${clientId}`);
}

function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  generateTokens,
  saveRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  verifyAccess,
  verifyRefresh,
};
