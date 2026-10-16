import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  const invalid = (message: string) => Object.assign(new Error(message), { status: 400 });
  const notFound = (message: string) => Object.assign(new Error(message), { status: 404 });

  if (!_input || typeof _input !== 'object') {
    throw invalid('Activity data is required');
  }

  const { userId, teamId, type, minutes } = _input as Record<string, unknown>;
  if (typeof userId !== 'string' || !userId.trim()) throw invalid('A valid userId is required');
  if (typeof teamId !== 'string' || !teamId.trim()) throw invalid('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw invalid('A valid activity type is required');
  const normalizedUserId = userId.trim();
  const normalizedTeamId = teamId.trim();
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  if (!objectIdPattern.test(normalizedUserId)) throw invalid('userId is invalid');
  if (!objectIdPattern.test(normalizedTeamId)) throw invalid('teamId is invalid');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw invalid('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(normalizedUserId),
    Team.findById(normalizedTeamId),
  ]);
  if (!user) throw notFound('User not found');
  if (!team) throw notFound('Team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  const invalid = (message: string) => Object.assign(new Error(message), { status: 400 });

  if (!_input || typeof _input !== 'object') {
    throw invalid('Team data is required');
  }

  const { name, mascot, members } = _input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) throw invalid('A valid team name is required');

  return Team.create({ name, mascot, members: members ?? [] });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return totals.map(({ teamName, totalPoints }, index) => ({
    teamName,
    totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);

  const normalize = (value: unknown) =>
    typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() : '';
  const goal = normalize(user.goal);
  const activityType = normalize(recentActivity?.type);
  const matches = (focus: string, preference: string) =>
    Boolean(focus && preference && (focus.includes(preference) || preference.includes(focus)));

  return workouts
    .map((workout) => {
      const focus = normalize(workout.focus);
      const goalMatch = matches(focus, goal);
      const activityMatch = matches(focus, activityType);
      const reason = goalMatch
        ? `Recommended because it matches your goal: ${user.goal}.`
        : activityMatch
          ? `Recommended based on your recent activity: ${recentActivity?.type}.`
          : 'Recommended to help you stay active.';

      return { workout: { ...workout, reason }, score: (goalMatch ? 2 : 0) + (activityMatch ? 1 : 0) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 1)
    .map(({ workout }) => workout);
}

export { User };
