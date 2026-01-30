import WorkerProfile from '../models/WorkerProfile.js';
import Job from '../models/Job.js';
import { availabilityScore } from './availability.js';

const DEFAULT_WEIGHTS = {
  distance: 0.3,
  price: 0.15,
  rating: 0.25,
  experience: 0.1,
  skill: 0.15,
  availability: 0.05,
  coldStart: 0.05
};

function haversineDistanceKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export async function rankWorkersForJob(jobId, weights = DEFAULT_WEIGHTS) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  const workers = await WorkerProfile.find({
    skills: { $in: job.skillsRequired },
    'location.coordinates': { $exists: true }
  }).populate('user');

  const distanceValues = workers.map(w =>
    haversineDistanceKm(job.location.coordinates, w.location.coordinates)
  );
  const rateValues = workers.map(w => w.hourlyRate || 0);
  const ratingValues = workers.map(w => w.ratingStats?.average || 4.0);
  const experienceValues = workers.map(w => w.experienceYears || 0);

  const distMin = Math.min(...distanceValues, 0);
  const distMax = Math.max(...distanceValues, 1);
  const rateMin = Math.min(...rateValues, 0);
  const rateMax = Math.max(...rateValues, 1);
  const ratingMin = Math.min(...ratingValues, 0);
  const ratingMax = Math.max(...ratingValues, 5);
  const expMin = Math.min(...experienceValues, 0);
  const expMax = Math.max(...experienceValues, 1);

  const ranked = workers
    .map((w, idx) => {
      const distanceKm = distanceValues[idx];
      const priceScore = 1 - normalize(w.hourlyRate, rateMin, rateMax);
      const ratingScore = normalize(w.ratingStats?.average || 4, ratingMin, ratingMax);
      const experienceScore = normalize(w.experienceYears || 0, expMin, expMax);
      const skillScore = job.skillsRequired?.length
        ? w.skills.filter(s => job.skillsRequired.includes(s)).length / job.skillsRequired.length
        : 0.5;
      const availabilityScoreValue = availabilityScore(w, job);
      const distanceScore = 1 - normalize(distanceKm, distMin, distMax);
      const coldStartScore = (w.completedJobs || 0) < 3 ? 0.65 : 1;

      const total =
        weights.distance * distanceScore +
        weights.price * priceScore +
        weights.rating * ratingScore +
        weights.experience * experienceScore +
        weights.skill * skillScore +
        weights.availability * availabilityScoreValue +
        weights.coldStart * coldStartScore;

      return {
        workerId: w.user._id,
        profileId: w._id,
        score: Number(total.toFixed(4)),
        breakdown: {
          distanceScore,
          priceScore,
          ratingScore,
          experienceScore,
          skillScore,
          availabilityScore: availabilityScoreValue,
          coldStartScore
        },
        distanceKm,
        hourlyRate: w.hourlyRate,
        rating: w.ratingStats?.average || 4,
        experienceYears: w.experienceYears,
        skills: w.skills,
        isAvailable: w.isAvailable
      };
    })
    .sort((a, b) => b.score - a.score);

  return { weights, ranked };
}
