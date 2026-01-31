import WorkerProfile from '../models/WorkerProfile.js';
import User from '../models/User.js';

export async function listWorkers(req, res) {
  const { skill, search } = req.query;
  const filters = {};
  if (skill) {
    filters.skills = { $in: [skill] };
  }
  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: 'i' } },
      { skills: { $regex: search, $options: 'i' } }
    ];
  }

  const profiles = await WorkerProfile.find(filters)
    .populate({ path: 'user', select: 'name email phone roles' })
    .limit(100)
    .sort({ 'ratingStats.average': -1 });

  const workers = profiles
    .filter(p => p.user)
    .map(p => ({
      id: p.user._id,
      name: p.user.name,
    email: p.user.email,
    phone: p.user.phone,
    roles: p.user.roles,
    avatarUrl: p.avatarUrl,
    title: p.title,
    skills: p.skills,
    experienceYears: p.experienceYears,
    hourlyRate: p.hourlyRate,
    rating: p.ratingStats?.average || 4,
    ratingCount: p.ratingStats?.count || 0,
    completedJobs: p.completedJobs || 0,
    isAvailable: p.isAvailable,
    bio: p.bio,
    location: p.location,
    portfolio: p.portfolio || [],
    profileId: p._id
  }));

  return res.json({ workers });
}

export async function updateMyProfile(req, res) {
  const { avatarUrl, bio, title } = req.body;
  const updates = {};
  if (avatarUrl) updates.avatarUrl = avatarUrl;
  if (bio !== undefined) updates.bio = bio;
  if (title !== undefined) updates.title = title;

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates, $setOnInsert: { user: req.user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.json({ profile });
}

import Rating from '../models/Rating.js';

export async function getWorkerById(req, res) {
  const { id } = req.params;
  try {
    const profile = await WorkerProfile.findOne({ user: id }).populate('user', 'name email phone roles avatarUrl verification ratingStats');
    
    // Fetch recent reviews
    const reviews = await Rating.find({ worker: id })
      .populate('customer', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .limit(5);

    // Fix: If profile exists but user is null (orphaned), treat as not found or handle gracefully
    if (profile && !profile.user) {
       return res.status(404).json({ message: 'Worker user not found' });
    }

    if (!profile) {
      const user = await User.findById(id).select('name email phone roles avatarUrl verification ratingStats');
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      return res.json({
        worker: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          roles: user.roles,
          avatarUrl: user.avatarUrl,
          verification: user.verification,
          ratingStats: user.ratingStats,
          workerProfile: null,
          reviews: reviews.map(r => ({
            id: r._id,
            reviewerName: r.customer?.name || 'Anonymous',
            reviewerAvatar: r.customer?.avatarUrl,
            rating: r.overall,
            comment: r.review,
            date: r.createdAt
          }))
        }
      });
    }

    return res.json({
      worker: {
        id: profile.user._id,
        name: profile.user.name,
        email: profile.user.email,
        phone: profile.user.phone,
        roles: profile.user.roles,
        avatarUrl: profile.avatarUrl || profile.user.avatarUrl,
        verification: profile.user.verification,
        ratingStats: profile.user.ratingStats,
        workerProfile: {
          title: profile.title,
          skills: profile.skills,
          experienceYears: profile.experienceYears,
          hourlyRate: profile.hourlyRate,
          bio: profile.bio,
          location: profile.location,
          availability: profile.availability,
          isAvailable: profile.isAvailable,
          completedJobs: profile.completedJobs
        },
        reviews: reviews.map(r => ({
          id: r._id,
          reviewerName: r.customer?.name || 'Anonymous',
          reviewerAvatar: r.customer?.avatarUrl,
          rating: r.overall,
          comment: r.review,
          date: r.createdAt
        }))
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch worker', error: err.message });
  }
}
