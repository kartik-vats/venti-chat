import { Router, type Request, type Response } from 'express';
import { Message } from '../models/Message';

const router = Router();

router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ deliveredAt: 1 }).limit(500).lean();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
