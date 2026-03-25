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

  // Validate job location
  if (!job.location?.coordinates || job.location.coordinates.length < 2) {
    throw new Error('Job location coordinates are not properly set');
  }

  const query = {
    'location.coordinates': { $exists: true }
  };
  
  if (job.skillsRequired && job.skillsRequired.length > 0) {
    query.skills = { $in: job.skillsRequired };
  }

  const workers = await WorkerProfile.find(query).populate('user');
  
  // If strict skill match returns nothing, fallback to location-based match only
  let rankedWorkers = workers;
  if (workers.length === 0 && job.skillsRequired && job.skillsRequired.length > 0) {
      const fallbackQuery = { 
        'location.coordinates': { $exists: true } 
      };
      rankedWorkers = await WorkerProfile.find(fallbackQuery).populate('user');
  }

  // Calculate distances with validation
  const distanceValues = rankedWorkers.map(w => {
    if (!w.location?.coordinates || w.location.coordinates.length < 2) {
      return 9999; // Worker location missing
    }
    try {
      const distance = haversineDistanceKm(job.location.coordinates, w.location.coordinates);
      return isNaN(distance) ? 9999 : distance;
    } catch (e) {
      console.error('Distance calculation error:', e);
      return 9999;
    }
  });
  
  const workerList = rankedWorkers; // Alias

  const rateValues = workerList.map(w => w.hourlyRate || 0);
  const ratingValues = workerList.map(w => w.ratingStats?.average || 4.0);
  const experienceValues = workerList.map(w => w.experienceYears || 0);

  // Only use valid distances (exclude 9999 fallback) for min/max calculation
  const validDistances = distanceValues.filter(d => d !== 9999);
  const distMin = validDistances.length > 0 ? Math.min(...validDistances) : 0;
  const distMax = validDistances.length > 0 ? Math.max(...validDistances) : 1;
  
  const rateMin = rateValues.length > 0 ? Math.min(...rateValues) : 0;
  const rateMax = rateValues.length > 0 ? Math.max(...rateValues) : 1;
  const ratingMin = ratingValues.length > 0 ? Math.min(...ratingValues) : 0;
  const ratingMax = ratingValues.length > 0 ? Math.max(...ratingValues) : 5;
  const expMin = experienceValues.length > 0 ? Math.min(...experienceValues) : 0;
  const expMax = experienceValues.length > 0 ? Math.max(...experienceValues) : 1;

  const ranked = workerList
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
        workerId: w.user?._id || w.user,
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
