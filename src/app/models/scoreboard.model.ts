export interface IScoreboardEntry {
  userDisplayName: string;
  userId: string;
  score: string;
  place: number;
  userThumbnail: string;
  scorecardId: string;
}

export interface IScoreboard {
  matchId: string;
  entries: IScoreboardEntry[];
  updatedAt: Date | null;
}
