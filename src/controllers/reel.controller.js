// Reel controller (ESM)
import asyncHandler from '../middleware/asyncHandler.js';
import { getAllReels } from '../services/reel.repository.js';

export const getReels = asyncHandler(async (req, res) => {
  const reels = await getAllReels();
  res.json({ success: true, count: reels.length, data: reels });
});

export const getReelById = asyncHandler(async (req, res) => {
  // TODO: Implement get reel by id
  res.json({ data: null });
});

export const createReel = asyncHandler(async (req, res) => {
  // TODO: Implement create reel
  res.status(201).json({ data: null });
});

export const updateReel = asyncHandler(async (req, res) => {
  // TODO: Implement update reel
  res.json({ data: null });
});

export const deleteReel = asyncHandler(async (req, res) => {
  // TODO: Implement delete reel
  res.json({ success: true });
});
