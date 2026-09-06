import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title cannot be blank').trim().optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  due_date: z.string().datetime().optional(),
  assignee_id: z.number().nullable().optional(),
});

/**
 * @swagger
 * /tasks/{taskId}:
 *   patch:
 *     summary: Partially update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               assignee_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch('/:taskId', async (req: AuthRequest, res: Response) => {
  const taskId = parseInt(req.params.taskId as string);
  const userId = req.user!.userId;
  const updates = updateTaskSchema.parse(req.body);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });

  if (!task) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
  }

  const isMember = task.project.members.some((m) => m.user_id === userId);
  if (!isMember) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a member of this project' } });
  }

  if (updates.assignee_id) {
    const isValidAssignee = task.project.members.some((m) => m.user_id === updates.assignee_id);
    if (!isValidAssignee) {
      return res.status(400).json({ error: { code: 'INVALID_ASSIGNEE', message: 'Assignee is not a project member' } });
    }
  }

  let completed_at = task.completed_at;
  if (updates.status === 'DONE' && task.status !== 'DONE') {
    completed_at = new Date();
  } else if (updates.status && updates.status !== 'DONE') {
    completed_at = null;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...updates,
      completed_at,
    },
  });

  res.json({ data: updatedTask });
});

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     summary: Delete task (Task creator or Project owner only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Task deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete('/:taskId', async (req: AuthRequest, res: Response) => {
  const taskId = parseInt(req.params.taskId as string);
  const userId = req.user!.userId;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
  }

  // To check task creator we need to store who created the task, but the schema only has assignee.
  // Wait, the requirements state: "Only the project owner or the task creator can delete it."
  // Oh no, I didn't add a `creator_id` to Task in schema! I need to update the Prisma Schema!
  // I will just check if user is owner for now and I will update schema.
  // Actually, I can check if user is owner OR user is the assignee? No, assignee != creator. 
  // Let me add creator_id to Task in schema.
  
  if (task.project.owner_id !== userId && task.creator_id !== userId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only project owner or task creator can delete this task' } });
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  res.status(204).send();
});

export default router;
