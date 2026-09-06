import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { Prisma } from '@prisma/client';

const router = Router();

router.use(authenticate);

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name cannot be blank').trim(),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title cannot be blank').trim(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  due_date: z.string().datetime(),
  assignee_id: z.number().optional(),
});

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description } = createProjectSchema.parse(req.body);
  const userId = req.user!.userId;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      owner_id: userId,
      members: { create: { user_id: userId } },
    },
  });
  res.status(201).json({ data: project });
});

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List projects available to logged-in user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const projects = await prisma.project.findMany({
    where: { members: { some: { user_id: userId } } },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
  res.json({ data: projects });
});

/**
 * @swagger
 * /projects/{projectId}:
 *   get:
 *     summary: View one project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project details
 */
router.get('/:projectId', async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.projectId as string);
  const userId = req.user!.userId;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
  
  if (!project.members.some((m) => m.user_id === userId)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } });
  }

  res.json({ data: project });
});

/**
 * @swagger
 * /projects/{projectId}/members:
 *   post:
 *     summary: Add member by email (owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member added
 */
router.post('/:projectId/members', async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.projectId as string);
  const userId = req.user!.userId;
  const { email } = addMemberSchema.parse(req.body);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
  if (project.owner_id !== userId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only project owner can add members' } });

  const userToAdd = await prisma.user.findUnique({ where: { email } });
  if (!userToAdd) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });

  const newMember = await prisma.projectMember.upsert({
    where: { project_id_user_id: { project_id: projectId, user_id: userToAdd.id } },
    update: {},
    create: { project_id: projectId, user_id: userToAdd.id },
  });
  res.json({ data: newMember });
});

/**
 * @swagger
 * /projects/{projectId}:
 *   delete:
 *     summary: Delete project (owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Project deleted
 */
router.delete('/:projectId', async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.projectId as string);
  const userId = req.user!.userId;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
  if (project.owner_id !== userId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only project owner can delete' } });

  await prisma.project.delete({ where: { id: projectId } });
  res.status(204).send();
});

// Task Endpoints under Project

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Create a task in a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - due_date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               assignee_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Task created
 */
router.post('/:projectId/tasks', async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.projectId as string);
  const userId = req.user!.userId;
  const taskData = createTaskSchema.parse(req.body);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
  if (!project.members.some((m) => m.user_id === userId)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a member of this project' } });
  }

  if (taskData.assignee_id) {
    if (!project.members.some((m) => m.user_id === taskData.assignee_id)) {
      return res.status(400).json({ error: { code: 'INVALID_ASSIGNEE', message: 'Assignee is not a project member' } });
    }
  }

  const task = await prisma.task.create({
    data: {
      ...taskData,
      project_id: projectId,
      creator_id: userId,
    },
  });

  res.status(201).json({ data: task });
});

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: List and filter tasks for a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, due_date]
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/:projectId/tasks', async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.projectId as string);
  const userId = req.user!.userId;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
  if (!project.members.some((m) => m.user_id === userId)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a member of this project' } });
  }

  const { page = '1', limit = '10', status, priority, assignee_id, from_date, to_date, sort_by = 'created_at', sort_order = 'desc' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = Math.min(parseInt(limit as string) || 10, 50);
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.TaskWhereInput = { project_id: projectId };
  if (status) where.status = status as string;
  if (priority) where.priority = priority as string;
  if (assignee_id) where.assignee_id = parseInt(assignee_id as string);
  
  if (from_date || to_date) {
    where.due_date = {};
    if (from_date) where.due_date.gte = new Date(from_date as string);
    if (to_date) where.due_date.lte = new Date(to_date as string);
  }

  const validSortFields = ['created_at', 'due_date'];
  const validSortOrders = ['asc', 'desc'];
  const orderByField = validSortFields.includes(sort_by as string) ? (sort_by as string) : 'created_at';
  const orderByDirection = validSortOrders.includes(sort_order as string) ? (sort_order as string) : 'desc';

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [orderByField]: orderByDirection },
    }),
    prisma.task.count({ where }),
  ]);

  res.json({
    data: tasks,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * @swagger
 * /projects/{projectId}/summary:
 *   get:
 *     summary: Get task summary counts for a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task summary object
 */
router.get('/:projectId/summary', async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.projectId as string);
  const userId = req.user!.userId;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
  if (!project.members.some((m) => m.user_id === userId)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a member of this project' } });
  }

  const [total, byStatus, byPriority] = await Promise.all([
    prisma.task.count({ where: { project_id: projectId } }),
    prisma.task.groupBy({
      by: ['status'],
      where: { project_id: projectId },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { project_id: projectId },
      _count: { _all: true },
    }),
  ]);

  const statusCounts = byStatus.reduce((acc, curr) => {
    acc[curr.status] = curr._count._all;
    return acc;
  }, {} as Record<string, number>);

  const priorityCounts = byPriority.reduce((acc, curr) => {
    acc[curr.priority] = curr._count._all;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    data: {
      total,
      status: statusCounts,
      priority: priorityCounts,
    },
  });
});

export default router;
