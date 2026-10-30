import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

type CreateActivityInput = {
  userId?: string;
  teamId?: string;
  type?: string;
  minutes?: number;
};

type CreateTeamInput = {
  name?: string;
  mascot?: string;
  members?: string[];
};

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  const input = (_input ?? {}) as CreateActivityInput;
  const { userId, teamId, type, minutes } = input;

  if (!userId || !teamId || !type || typeof minutes !== 'number' || minutes <= 0) {
    throw httpError(400, 'Invalid activity payload');
  }
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw httpError(400, 'Malformed userId or teamId');
  }

  const [user, team] = await Promise.all([User.findById(userId).select('_id'), Team.findById(teamId).select('_id')]);
  if (!user || !team) {
    throw httpError(404, 'User or team not found');
  }

  const points = Math.round(minutes);
  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  const input = (_input ?? {}) as CreateTeamInput;
  const { name, mascot } = input;
  const members = input.members ?? [];

  if (!name || !mascot || !Array.isArray(members)) {
    throw httpError(400, 'Invalid team payload');
  }
  if (!members.every((memberId) => typeof memberId === 'string' && mongoose.Types.ObjectId.isValid(memberId))) {
    throw httpError(400, 'Malformed team member id');
  }

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{
    _id: mongoose.Types.ObjectId;
    totalPoints: number;
  }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
  ]);

  if (!totals.length) {
    return [];
  }

  const teams = await Team.find({ _id: { $in: totals.map((entry) => entry._id) } }).select('_id name').lean();
  const teamNameById = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals.map((entry, index) => ({
    teamName: teamNameById.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('_id fitnessGoal').lean();
  if (!user) {
    throw httpError(404, 'User not found');
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean();
  const preferredFocus = recentActivity?.type === 'run' ? 'endurance' : (recentActivity?.type ?? user.fitnessGoal);

  const workouts = await Workout.find().lean();
  const suggestions = workouts
    .sort((a, b) => Number(b.focus === preferredFocus) - Number(a.focus === preferredFocus))
    .map((workout) => {
      const reason = workout.focus === preferredFocus
        ? `Matches your recent ${recentActivity?.type ?? 'activity'} pattern and ${user.fitnessGoal} goal.`
        : `Supports overall activity variety while you train for ${user.fitnessGoal}.`;
      return { ...workout, reason };
    });

  return suggestions;
}

export { User };
