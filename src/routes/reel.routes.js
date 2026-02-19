// Reel routes (ESM)
import express from 'express';
import {
	getAllReels,
	getReelById,
	createReel,
	updateReel,
	deleteReel,
} from '../controllers/reel.controller.js';

const router = express.Router();

router.get('/reels', getAllReels);
router.get('/reels/:id', getReelById);
router.post('/reels', createReel);
router.put('/reels/:id', updateReel);
router.delete('/reels/:id', deleteReel);

export default router;
