import Rating from '../models/Rating.js';
import WorkerProfile from '../models/WorkerProfile.js';

export async function addRating({ jobId, taskId, workerId, customerId, scores, review }) {
  const { punctuality, quality, professionalism } = scores;
  const overall = Number(((punctuality + quality + professionalism) / 3).toFixed(2));
  const rating = await Rating.create({
    job: jobId,
    task: taskId,
    worker: workerId,
    customer: customerId,
    punctuality,
    quality,
    professionalism,
    overall,
    review
  });

  await recomputeWorkerStats(workerId);
  return rating;
}

export async function recomputeWorkerStats(workerId) {
  const agg = await Rating.aggregate([
    { $match: { worker: workerId } },
    {
      $group: {
        _id: '$worker',
        count: { $sum: 1 },
        avgPunctuality: { $avg: '$punctuality' },
        avgQuality: { $avg: '$quality' },
        avgProfessionalism: { $avg: '$professionalism' },
        avgOverall: { $avg: '$overall' }
      }
    }
  ]);

  const stats = agg[0];
  if (!stats) {
    await WorkerProfile.findOneAndUpdate(
      { user: workerId },
      {
        ratingStats: { average: 4.0, count: 0, lastUpdated: new Date() }
      }
    );
    return;
  }

  await WorkerProfile.findOneAndUpdate(
    { user: workerId },
    {
      ratingStats: {
        average: Number(stats.avgOverall.toFixed(2)),
        count: stats.count,
        lastUpdated: new Date()
      }
    }
  );
}
