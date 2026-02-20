// Reel routes (ESM)
import express from 'express';
import {
	getReels,
	getReelById,
	createReel,
	updateReel,
	deleteReel,
} from '../controllers/reel.controller.js';

const router = express.Router();

router.get('/', getReels);
router.get('/:id', getReelById);
router.post('/', createReel);
router.put('/:id', updateReel);
router.delete('/:id', deleteReel);

export default router;
