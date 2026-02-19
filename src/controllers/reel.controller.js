// Reel controller (ESM)
import asyncHandler from '../middleware/asyncHandler.js';
import * as ReelServiceModule from '../services/reel.service.js';
const ReelService = ReelServiceModule.ReelService || ReelServiceModule.default || ReelServiceModule;

export const getAllReels = asyncHandler(async (req, res) => {
  // TODO: Implement get all reels
  res.json({ data: [] });
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
