import { generateAccessToken } from '../services/jwt.service.js';

export const generateToken = (payload) => {
  return generateAccessToken(payload);
};
