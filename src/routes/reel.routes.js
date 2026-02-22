// Reel routes (ESM)
import express from 'express';
import {
	getReels,
	getReelById,
	createReel,
	updateReel,
	deleteReel,
	starReel
} from '../controllers/reel.controller.js';
import { addReminder } from '../controllers/reminder.controller.js';

const router = express.Router();

router.get('/', getReels);
router.get('/:id', getReelById);
router.post('/', createReel);
router.put('/:id', updateReel);
router.delete('/:id', deleteReel);
router.patch('/:id/star', starReel);
router.post('/:id/reminders', addReminder);

export default router;
