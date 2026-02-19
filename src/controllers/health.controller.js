// Health controller (ESM)
import asyncHandler from '../middleware/asyncHandler.js';

export const checkHealth = asyncHandler(async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
