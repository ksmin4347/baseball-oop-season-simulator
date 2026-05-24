export type TeamId = string;

export type PitcherRole = "SP" | "RP" | "CP";
export type BullpenTier = "SETUP" | "MOPUP" | "LONG" | "CLOSER" | null;
export type SimulationMode = "REALISTIC" | "USER_BOOST" | null;

export interface TeamMeta {
  id: TeamId;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  region: string;
  stadium: string;
}

export interface BatterRatings {
  contact: number;
  power: number;
  discipline: number;
  speed: number;
  clutch: number;
}

export interface PitcherRatings {
  stuff: number;
  control: number;
  stamina: number;
  crisis: number;
}

export interface BatterData extends BatterRatings {
  id: string;
  teamId: TeamId;
  lineupNo: number;
  position: string;
  name: string;
  stats: BatterStats;
}

export interface PitcherData extends PitcherRatings {
  id: string;
  teamId: TeamId;
  name: string;
  role: PitcherRole;
  label: string;
  rotationNo: number | null;
  bullpenTier: BullpenTier;
  stats: PitcherStats;
}

export interface BatterStats {
  games: number;
  plateAppearances: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  sacFlies: number;
  strikeouts: number;
  gidp: number;
  rispAtBats: number;
  rispHits: number;
  contribution: number;
  gameMvp: number;
  highlights: number;
}

export interface PitcherStats {
  games: number;
  outs: number;
  earnedRuns: number;
  wins: number;
  losses: number;
  saves: number;
  holds: number;
  strikeouts: number;
  walks: number;
  hitsAllowed: number;
  homeRunsAllowed: number;
  contribution: number;
  gameMvp: number;
  highlights: number;
  blownSaves: number;
  qualityStarts: number;
}

export interface TeamRecord {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  runsFor: number;
  runsAgainst: number;
  streakType: "W" | "L" | "D" | "";
  streakCount: number;
  recent: ("W" | "L" | "D")[];
  headToHead: Record<TeamId, HeadToHeadRecord>;
}

export interface HeadToHeadRecord {
  wins: number;
  draws: number;
  losses: number;
  runsFor: number;
  runsAgainst: number;
  homeWins: number;
  awayWins: number;
}

export interface TeamState extends TeamMeta {
  batters: BatterData[];
  pitchers: PitcherData[];
  record: TeamRecord;
  lineupIndex: number;
  starterIndex: number;
}

export interface ScheduleGame {
  id: string;
  round: number;
  awayTeamId: TeamId;
  homeTeamId: TeamId;
}

export interface SeasonState {
  appName: string;
  selectedTeamId: TeamId | null;
  simulationMode: SimulationMode;
  userBoostedTeamId: TeamId | null;
  currentRound: number;
  schedule: ScheduleGame[][];
  teams: TeamState[];
  recentGames: GameSummary[];
  lastSavedAt: string | null;
  seasonFinished: boolean;
}

export type Half = "초" | "말";

export interface BaseState {
  first: string | null;
  second: string | null;
  third: string | null;
}

export type PlayKind =
  | "WALK"
  | "SINGLE"
  | "DOUBLE"
  | "TRIPLE"
  | "HOMER"
  | "STRIKEOUT"
  | "GROUNDOUT"
  | "FLYOUT"
  | "INFIELD_FLY"
  | "SAC_FLY"
  | "DOUBLE_PLAY";

export interface PlayLog {
  id: string;
  inning: number;
  half: Half;
  offenseTeamId: TeamId;
  defenseTeamId: TeamId;
  batterId: string;
  batterName: string;
  pitcherId: string;
  pitcherName: string;
  result: string;
  kind: PlayKind;
  message: string;
  zone: string;
  outsBefore: number;
  outsAfter: number;
  awayScore: number;
  homeScore: number;
  runsScored: number;
  rbi: number;
  basesAfter: BaseState;
  actualClass: "Batter" | "Pitcher" | "GameEvent";
  parentClass: "BaseballPlayer" | "BaseEvent";
  methodCalled: "play()" | "apply()";
  oopMessage: string;
  highlightScore: number;
  contribution: Record<string, number>;
  scoredRunnerIds: string[];
}

export interface GameSummary {
  id: string;
  round: number;
  awayTeamId: TeamId;
  homeTeamId: TeamId;
  awayTeamName: string;
  homeTeamName: string;
  awayScore: number;
  homeScore: number;
  winnerTeamId: TeamId | null;
  loserTeamId: TeamId | null;
  isDraw: boolean;
  innings: number;
  logs: PlayLog[];
  highlights: PlayLog[];
  mvpPlayerId: string | null;
  mvpName: string | null;
  mvpTeamId: TeamId | null;
  events: string[];
}

export interface StandingRow {
  rank: number;
  team: TeamState;
  winRate: number;
  gamesBehind: number;
  teamAvg: number;
  teamEra: number;
  obp: number;
  slg: number;
  ops: number;
  teamHomeRuns: number;
  teamStrikeouts: number;
}

export interface AwardResult {
  seasonMvp?: { playerName: string; teamName: string; score: number };
  goldenGloves: { position: string; playerName: string; teamName: string; score: number }[];
}