import Munkres from 'munkres-js';
import Job from '../models/Job.js';
import Task from '../models/Task.js';
import { rankWorkersForJob } from './matching.js';

// roles: [{ role: 'plumber', skill: 'plumbing' }, ...]
export async function optimizeTeam(jobId, roles = []) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');
  if (!roles.length) throw new Error('No roles provided');

  const ranking = await rankWorkersForJob(jobId);
  const workers = ranking.ranked; // array of { workerId, skills, score }

  const m = roles.length;
  const n = workers.length;
  if (n === 0) return { assignments: [], tasks: [] };

  const HIGH_COST = 9999;
  const costMatrix = Array.from({ length: m }, () => Array(n).fill(HIGH_COST));

  for (let i = 0; i < m; i += 1) {
    const role = roles[i];
    for (let j = 0; j < n; j += 1) {
      const worker = workers[j];
      const hasSkill = worker.skills?.includes(role.skill || role.role);
      if (!hasSkill) {
        costMatrix[i][j] = HIGH_COST;
        continue;
      }
      // Lower cost = better; use (1 - score)
      // Also consider availability: if not available, high cost
      if (worker.isAvailable === false) {
        costMatrix[i][j] = HIGH_COST;
        continue;
      }
      costMatrix[i][j] = Number((1 - worker.score).toFixed(4));
    }
  }

  const munkres = new Munkres();
  const indices = munkres.compute(costMatrix);

  const validAssignments = indices
    .filter(([i, j]) => costMatrix[i][j] < HIGH_COST)
    .map(([i, j]) => ({ role: roles[i], worker: workers[j] }));

  const tasks = [];
  for (const a of validAssignments) {
    const task = await Task.create({
      job: job._id,
      worker: a.worker.workerId,
      role: a.role.role,
      payout: job.budget?.max || 0
    });
    tasks.push(task);
  }

  job.team = tasks.map(t => t._id);
  job.assignedWorkers = tasks.map(t => t.worker);
  job.status = tasks.length ? 'assigned' : job.status;
  await job.save();

  return { assignments: validAssignments, tasks, job }; 
}
