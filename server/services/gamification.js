import WorkerProfile from '../models/WorkerProfile.js';
import Rating from '../models/Rating.js';

const BADGE_DEFINITIONS = {
  FIRST_JOB: {
    id: 'first_job',
    name: 'Rookie Rising',
    icon: '🚀',
    points: 50,
    description: 'Completed the first job on WorkLink.'
  },
  VERIFIED_PRO: {
    id: 'verified_pro',
    name: 'Verified Pro',
    icon: '✅',
    points: 100,
    description: 'Identity verified and background checked.'
  },
  FIVE_STAR_STREAK: {
    id: 'five_star_streak',
    name: 'Customer Favorite',
    icon: '⭐',
    points: 200,
    description: 'Maintained a 5-star rating for 5 consecutive jobs.'
  },
  COMMUNITY_HERO: {
    id: 'community_hero',
    name: 'Community Hero',
    icon: '🦸',
    points: 500,
    description: 'Completed 50+ jobs with high satisfaction.'
  }
};

/**
 * Checks if a worker qualifies for new badges and updates reputation points.
 * @param {string} workerId - The ID of the worker user.
 */
export async function checkAndAwardBadges(workerId) {
  try {
    const profile = await WorkerProfile.findOne({ user: workerId });
    if (!profile) return;

    const ratings = await Rating.find({ worker: workerId }).sort({ createdAt: -1 });
    const completedJobs = profile.completedJobs || 0;
    
    const newBadges = [];
    const existingBadgeIds = new Set(profile.badges?.map(b => b.id) || []);

    // 1. Check FIRST_JOB
    if (completedJobs >= 1 && !existingBadgeIds.has(BADGE_DEFINITIONS.FIRST_JOB.id)) {
      newBadges.push(BADGE_DEFINITIONS.FIRST_JOB);
    }

    // 2. Check VERIFIED_PRO
    if (profile.isVerified && !existingBadgeIds.has(BADGE_DEFINITIONS.VERIFIED_PRO.id)) {
      newBadges.push(BADGE_DEFINITIONS.VERIFIED_PRO);
    }

    // 3. Check FIVE_STAR_STREAK (last 5 ratings are 5 stars)
    if (ratings.length >= 5 && !existingBadgeIds.has(BADGE_DEFINITIONS.FIVE_STAR_STREAK.id)) {
      const lastFive = ratings.slice(0, 5);
      const isPerfect = lastFive.every(r => r.rating === 5);
      if (isPerfect) newBadges.push(BADGE_DEFINITIONS.FIVE_STAR_STREAK);
    }

    // 4. Check COMMUNITY_HERO
    if (completedJobs >= 50 && !existingBadgeIds.has(BADGE_DEFINITIONS.COMMUNITY_HERO.id)) {
      newBadges.push(BADGE_DEFINITIONS.COMMUNITY_HERO);
    }

    if (newBadges.length > 0) {
      // Add badges to profile
      const badgeObjects = newBadges.map(def => ({
        id: def.id,
        name: def.name,
        icon: def.icon,
        awardedAt: new Date()
      }));

      profile.badges.push(...badgeObjects);

      // Initialize reputation points if undefined
      if (typeof profile.reputationPoints !== 'number') {
        profile.reputationPoints = 0;
      }
      
      // Add points for new badges
      const pointsToAdd = newBadges.reduce((sum, b) => sum + (b.points || 0), 0);
      profile.reputationPoints += pointsToAdd;

      await profile.save();
      console.log(`Awarded ${newBadges.length} new badges to worker ${workerId}`);
    }

    return newBadges;
  } catch (error) {
    console.error('Error awarding badges:', error);
  }
}

/**
 * Recalculates reputation points based on activity.
 * Formula: (Completed Jobs * 10) + (Avg Rating * 20) + (Badge Points)
 */
export async function recalculateReputation(workerId) {
  try {
    const profile = await WorkerProfile.findOne({ user: workerId });
    if (!profile) return;

    const ratings = await Rating.find({ worker: workerId });
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
    
    const badgePoints = profile.badges.reduce((sum, badge) => {
      const def = Object.values(BADGE_DEFINITIONS).find(d => d.id === badge.id);
      return sum + (def ? def.points : 0);
    }, 0);

    const jobPoints = (profile.completedJobs || 0) * 10;
    const ratingPoints = Math.round(avgRating * 20);

    profile.reputationPoints = jobPoints + ratingPoints + badgePoints;
    await profile.save();
    
    return profile.reputationPoints;
  } catch (error) {
    console.error('Error recalculating reputation:', error);
  }
}

export async function getLeaderboard(limit = 10) {
  try {
    const profiles = await WorkerProfile.find({ isAvailable: true })
      .sort({ reputationPoints: -1, completedJobs: -1 })
      .limit(limit)
      .populate('user', 'name avatarUrl');
    
    return profiles;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}
