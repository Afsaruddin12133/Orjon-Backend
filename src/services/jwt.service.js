import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

const ACCESS_TOKEN_EXPIRES_IN = env.jwtAccessExpiresIn || '60m';
const REFRESH_TOKEN_EXPIRES_IN = env.jwtRefreshExpiresIn || '7d';

export const generateAccessToken = (payload) => {
  return jwt.sign({ ...payload, tokenType: 'access' }, env.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, env.jwtSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });
};

export const verifyJwt = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

export const issueAuthTokens = (basePayload) => {
  const accessToken = generateAccessToken(basePayload);
  const refreshToken = generateRefreshToken(basePayload);

  // Keep token for backward compatibility with older clients.
  return {
    token: accessToken,
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    refreshExpiresIn: REFRESH_TOKEN_EXPIRES_IN
  };
};
