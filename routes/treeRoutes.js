import express from 'express';
import {
  showTree
} from '../controllers/treeController.js';

const router = express.Router();

router.post('/', showTree);

export default router;
