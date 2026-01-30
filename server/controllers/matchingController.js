import { rankWorkersForJob } from '../services/matching.js';

export async function getRanking(req, res) {
  const { jobId } = req.params;
  const weights = req.body?.weights || undefined;
  try {
    const result = await rankWorkersForJob(jobId, weights);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
