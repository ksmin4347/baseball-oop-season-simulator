import { createInitialTeams } from "./data";
import type {
  BaseState,
  BatterData,
  BatterStats,
  GameSummary,
  Half,
  HeadToHeadRecord,
  PitcherData,
  PlayKind,
  PlayLog,
  ScheduleGame,
  SeasonState,
  StandingRow,
  TeamId,
  TeamState,
} from "./types";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const pct = (value: number) => clamp(value, 0.01, 0.99);
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const randomChoice = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const emptyBases = (): BaseState => ({ first: null, second: null, third: null });
const emptyBaseResponsibility = (): BaseState => ({ first: null, second: null, third: null });

const countBases = (bases: BaseState) =>
  Number(Boolean(bases.first)) + Number(Boolean(bases.second)) + Number(Boolean(bases.third));

// 세이브/홀드 상황 판단: 3점 이내 리드이거나, 동점 주자가 루상/타석/대기타석에 있는 상황.
const isSaveSituationForLead = (lead: number, bases: BaseState) => {
  if (lead <= 0) return false;
  const runners = countBases(bases);
  return lead <= 3 || lead <= runners + 2;
};

const getTeam = (state: SeasonState, teamId: TeamId) => {
  const team = state.teams.find((t) => t.id === teamId);
  if (!team) throw new Error(`팀을 찾을 수 없습니다: ${teamId}`);
  return team;
};

const getPlayerName = (team: TeamState, playerId: string | null) => {
  if (!playerId) return "";
  return team.batters.find((b) => b.id === playerId)?.name ?? "";
};

const addContribution = (player: BatterData | PitcherData, points: number) => {
  player.stats.contribution += points;
};

const getBatterStats = (batter: BatterData): BatterStats => batter.stats;

const recordRecent = (team: TeamState, result: "W" | "L" | "D") => {
  team.record.recent.unshift(result);
  team.record.recent = team.record.recent.slice(0, 10);

  if (team.record.streakType === result) {
    team.record.streakCount += 1;
  } else {
    team.record.streakType = result;
    team.record.streakCount = 1;
  }
};

const updateHeadToHead = (
  team: TeamState,
  opponentId: TeamId,
  result: "W" | "L" | "D",
  runsFor: number,
  runsAgainst: number,
  wasHome: boolean,
) => {
  const h2h: HeadToHeadRecord = team.record.headToHead[opponentId];
  if (result === "W") h2h.wins += 1;
  if (result === "L") h2h.losses += 1;
  if (result === "D") h2h.draws += 1;
  h2h.runsFor += runsFor;
  h2h.runsAgainst += runsAgainst;
  if (result === "W" && wasHome) h2h.homeWins += 1;
  if (result === "W" && !wasHome) h2h.awayWins += 1;
};

export const generateSchedule = (teamIds: TeamId[]): ScheduleGame[][] => {
  const rounds: ScheduleGame[][] = [];
  const base = [...teamIds];

  // 10팀 원형 라운드 로빈. 9라운드에 모든 팀이 한 번씩 만난다.
  const oneCycle: [TeamId, TeamId][][] = [];
  let rotation = [...base];

  for (let round = 0; round < teamIds.length - 1; round += 1) {
    const pairings: [TeamId, TeamId][] = [];
    for (let i = 0; i < teamIds.length / 2; i += 1) {
      pairings.push([rotation[i], rotation[teamIds.length - 1 - i]]);
    }
    oneCycle.push(pairings);
    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
  }

  for (let cycle = 0; cycle < 16; cycle += 1) {
    oneCycle.forEach((pairings, cycleRound) => {
      const games = pairings.map(([a, b], gameIndex) => {
        const flip = (cycle + cycleRound + gameIndex) % 2 === 0;
        const awayTeamId = flip ? a : b;
        const homeTeamId = flip ? b : a;
        const round = rounds.length + 1;
        return {
          id: `R${round}-G${gameIndex + 1}`,
          round,
          awayTeamId,
          homeTeamId,
        };
      });
      rounds.push(games);
    });
  }

  return rounds;
};

export const createNewSeason = (): SeasonState => {
  const teams = createInitialTeams();
  return {
    appName: "Baseball OOP Season Simulator",
    selectedTeamId: null,
    simulationMode: null,
    userBoostedTeamId: null,
    currentRound: 0,
    schedule: generateSchedule(teams.map((t) => t.id)),
    teams,
    recentGames: [],
    lastSavedAt: null,
    seasonFinished: false,
  };
};

interface LivePitcher {
  pitcherId: string;
  teamId: TeamId;
  outs: number;
  runs: number;
  enteredWithLead: number;
  enteredInning: number;
  enteredSaveSituation: boolean;
  enteredTyingRunSituation: boolean;
  lostLeadDuringAppearance: boolean;
  blownSaveRecorded: boolean;
  leftWithLead?: boolean;
}

interface GameContext {
  summary: GameSummary;
  away: TeamState;
  home: TeamState;
  inning: number;
  half: Half;
  offense: TeamState;
  defense: TeamState;
  outs: number;
  bases: BaseState;
  baseResponsibility: BaseState;
  awayScore: number;
  homeScore: number;
  livePitchers: Record<TeamId, LivePitcher[]>;
  currentPitcher: Record<TeamId, PitcherData>;
  pitcherEnergy: Record<string, number>;
  pitcherUsed: Record<TeamId, string[]>;
  batterGameScore: Record<string, number>;
  pitcherGameScore: Record<string, number>;
  scoringEvents: { runNoForWinnerCandidate: number; scoringTeamId: TeamId; pitcherId: string }[];
  scoredThisPlay: string[];
}

const hitKinds: PlayKind[] = ["SINGLE", "DOUBLE", "TRIPLE", "HOMER"];
const atBatKinds: PlayKind[] = ["SINGLE", "DOUBLE", "TRIPLE", "HOMER", "STRIKEOUT", "GROUNDOUT", "FLYOUT", "INFIELD_FLY", "DOUBLE_PLAY"];

const battingAvoidK = (batter: BatterData) => batter.contact * 0.6 + batter.discipline * 0.4;

const scoreDiffForDefense = (ctx: GameContext, defense: TeamState) => {
  const own = defense.id === ctx.away.id ? ctx.awayScore : ctx.homeScore;
  const other = defense.id === ctx.away.id ? ctx.homeScore : ctx.awayScore;
  return own - other;
};

const isWalkOffState = (ctx: GameContext) =>
  ctx.half === "말" && ctx.inning >= 9 && ctx.offense.id === ctx.home.id && ctx.homeScore > ctx.awayScore;

const chooseStartingPitcher = (team: TeamState) => {
  const starters = team.pitchers.filter((p) => p.role === "SP").sort((a, b) => (a.rotationNo ?? 9) - (b.rotationNo ?? 9));
  const starter = starters[team.starterIndex % starters.length] ?? starters[0] ?? team.pitchers[0];
  team.starterIndex = (team.starterIndex + 1) % Math.max(1, starters.length);
  return starter;
};

const selectLeastUsed = (pitchers: PitcherData[]) =>
  [...pitchers].sort((a, b) =>
    a.stats.outs - b.stats.outs ||
    a.stats.games - b.stats.games ||
    b.crisis - a.crisis
  )[0];

const initialPitcherEnergy = (pitcher: PitcherData) => {
  // 선발은 매 경기 100에서 시작하고, stamina 능력치는 체력 소모량 보정에 사용한다.
  // 불펜은 1이닝 운용이 기본이므로 낮게 시작해도 된다.
  if (pitcher.role === "SP") return 100;
  if (pitcher.bullpenTier === "CLOSER") return 42;
  if (pitcher.bullpenTier === "LONG") return 46;
  return 38;
};

const chooseReliever = (ctx: GameContext, team: TeamState) => {
  const used = new Set(ctx.pitcherUsed[team.id]);
  const diff = scoreDiffForDefense(ctx, team);
  const inning = ctx.inning;

  const available = (tier: string) => team.pitchers.filter((p) => p.bullpenTier === tier && !used.has(p.id));

  if (inning >= 9 && diff >= 1 && diff <= 3) {
    const closer = team.pitchers.find((p) => p.bullpenTier === "CLOSER" && !used.has(p.id));
    if (closer) return closer;
  }

  const setup = available("SETUP");
  const mopup = available("MOPUP");
  const longRelief = available("LONG");

  // 롱릴리프는 필승조/패전조 상황 양쪽 모두에서 등판 가능한 전천후 투수로 운용한다.
  // 같은 불펜 한 명이 과도하게 많은 경기수를 기록하지 않도록, 후보군 안에서 시즌 누적 이닝이 적은 투수부터 쓴다.
  if (diff > 0 && inning >= 7 && (setup.length || longRelief.length)) {
    return selectLeastUsed([...setup, ...longRelief]);
  }
  if (diff < 0 && (mopup.length || longRelief.length)) {
    return selectLeastUsed([...mopup, ...longRelief]);
  }
  if (diff === 0 && inning >= 8 && (setup.length || longRelief.length)) {
    return selectLeastUsed([...setup, ...longRelief]);
  }
  if (longRelief.length && inning <= 6) return selectLeastUsed(longRelief);
  if (mopup.length) return selectLeastUsed(mopup);
  if (setup.length) return selectLeastUsed(setup);
  if (longRelief.length) return selectLeastUsed(longRelief);

  // 정말 투수가 부족한 연장 상황에서는 이미 쓴 불펜 중 누적 이닝이 가장 적은 투수를 비상 재등판시킨다.
  return selectLeastUsed(team.pitchers.filter((p) => p.role !== "SP")) ?? team.pitchers[0];
};

const installPitcher = (ctx: GameContext, team: TeamState, pitcher: PitcherData) => {
  const diff = scoreDiffForDefense(ctx, team);
  const enteredTyingRunSituation = diff > 0 && diff <= countBases(ctx.bases) + 2;
  const enteredSaveSituation = pitcher.role !== "SP" && isSaveSituationForLead(diff, ctx.bases);
  ctx.currentPitcher[team.id] = pitcher;
  if (!ctx.pitcherUsed[team.id].includes(pitcher.id)) ctx.pitcherUsed[team.id].push(pitcher.id);
  ctx.pitcherEnergy[pitcher.id] = initialPitcherEnergy(pitcher);

  pitcher.stats.games += 1;
  ctx.livePitchers[team.id].push({
    pitcherId: pitcher.id,
    teamId: team.id,
    outs: 0,
    runs: 0,
    enteredWithLead: diff,
    enteredInning: ctx.inning,
    enteredSaveSituation,
    enteredTyingRunSituation,
    lostLeadDuringAppearance: false,
    blownSaveRecorded: false,
  });
};

const maybeChangePitcher = (ctx: GameContext, team: TeamState, force = false) => {
  const current = ctx.currentPitcher[team.id];
  const live = ctx.livePitchers[team.id][ctx.livePitchers[team.id].length - 1];

  if (!current || !live) {
    installPitcher(ctx, team, chooseStartingPitcher(team));
    return;
  }

  const diff = scoreDiffForDefense(ctx, team);
  const energy = ctx.pitcherEnergy[current.id] ?? current.stamina;

  let shouldChange = force;

  if (current.role === "SP") {
    // 선발 이닝 조정: 1~2선발은 6.1~7이닝, 3선발은 5.2~6.1이닝, 4~5선발은 5.1~6이닝 근처를 목표로 한다.
    const rotation = current.rotationNo ?? 5;
    const minOuts = rotation <= 2 ? 19 : rotation === 3 ? 17 : 16;
    const softLimit = rotation <= 2 ? 21 : rotation === 3 ? 19 : 18;
    const fatigueLimit = rotation <= 2 ? 40 : rotation === 3 ? 47 : 54;
    if (energy <= 0) shouldChange = true;
    if (live.outs >= minOuts && energy <= fatigueLimit) shouldChange = true;
    if (live.outs >= softLimit) shouldChange = true;
  } else {
    // 일반 불펜은 1이닝, 롱릴리프는 상황에 따라 최대 2이닝까지 소화한다.
    const reliefLimit = current.bullpenTier === "LONG" ? 6 : 3;
    if (live.outs >= reliefLimit) shouldChange = true;
    if (current.bullpenTier === "CLOSER" && diff < 0) shouldChange = true;
  }

  if (!shouldChange) return;

  live.leftWithLead = diff > 0;
  const next = chooseReliever(ctx, team);
  installPitcher(ctx, team, next);
};

const getNextBatter = (team: TeamState) => {
  const batter = team.batters[team.lineupIndex % team.batters.length];
  team.lineupIndex = (team.lineupIndex + 1) % team.batters.length;
  return batter;
};

const getZoneForResult = (result: string, kind: PlayKind) => {
  if (kind === "STRIKEOUT" || kind === "WALK") return "home";
  if (result.includes("좌익선상")) return "leftLine";
  if (result.includes("우익선상")) return "rightLine";
  if (result.includes("좌중간")) return "leftCenter";
  if (result.includes("우중간")) return "rightCenter";
  if (kind === "HOMER") return "homer";
  if (result.includes("유격수")) return "short";
  if (result.includes("2루")) return "second";
  if (result.includes("1루")) return "first";
  if (result.includes("3루")) return "third";
  if (result.includes("좌익수") || result.includes("좌전")) return "left";
  if (result.includes("중견수") || result.includes("중전")) return "center";
  if (result.includes("우익수") || result.includes("우전")) return "right";
  return "mound";
};

const outResult = (pitcher: PitcherData): { kind: PlayKind; result: string } => {
  const groundChance = pct(0.43 + (pitcher.stuff - 70) * 0.002);
  const r = Math.random();

  if (r < groundChance) {
    return { kind: "GROUNDOUT", result: randomChoice(["1루 땅볼", "2루 땅볼", "3루 땅볼", "유격수 땅볼", "투수 땅볼"]) };
  }

  if (r < groundChance + 0.37) {
    return { kind: "FLYOUT", result: randomChoice(["좌익수 뜬공", "중견수 뜬공", "우익수 뜬공"]) };
  }

  return { kind: "INFIELD_FLY", result: randomChoice(["1루수 뜬공", "2루수 뜬공", "3루수 뜬공", "유격수 뜬공", "포수 파울플라이"]) };
};

const hitResult = (batter: BatterData, pitcher: PitcherData): { kind: PlayKind; result: string } => {
  const powerEdge = batter.power - pitcher.stuff;
  // 타율은 유지하면서 홈런 부족 문제를 보정하기 위해, 안타가 나온 뒤 홈런으로 전환되는 비율만 소폭 상향했다.
  const hr = pct(0.067 + (powerEdge * 0.0055) + (batter.clutch - 70) * 0.00035);
  const triple = pct(0.014 + (batter.speed - 70) * 0.0007 + (batter.power - 70) * 0.00022);
  const double = pct(0.232 + powerEdge * 0.00105);
  const r = Math.random();

  if (r < hr) return { kind: "HOMER", result: "홈런" };
  if (r < hr + triple) return { kind: "TRIPLE", result: randomChoice(["우중간 3루타", "좌중간 3루타"]) };
  if (r < hr + triple + double) return { kind: "DOUBLE", result: randomChoice(["좌익선상 2루타", "좌중간 2루타", "우중간 2루타", "우익선상 2루타"]) };
  return { kind: "SINGLE", result: randomChoice(["좌전 안타", "중전 안타", "우전 안타"]) };
};

const fatigueLoss = (kind: PlayKind, runs: number, battersFacedInInning: number) => {
  let loss = 1.65;
  if (kind === "STRIKEOUT") loss = 1.25;
  if (kind === "GROUNDOUT" || kind === "FLYOUT" || kind === "INFIELD_FLY") loss = 1.9;
  if (kind === "DOUBLE_PLAY") loss = 2.15;
  if (kind === "SAC_FLY") loss = 3.35;
  if (kind === "WALK") loss = 5.5;
  if (kind === "SINGLE") loss = 6.1;
  if (kind === "DOUBLE") loss = 7.35;
  if (kind === "TRIPLE") loss = 8.3;
  if (kind === "HOMER") loss = 10.5;
  loss += runs * 1.9;
  if (battersFacedInInning >= 5) loss += 0.7;
  if (battersFacedInInning >= 7) loss += 1.4;
  return loss;
};

const applyStaminaModifier = (pitcher: PitcherData, loss: number) => {
  const factor =
    pitcher.stamina >= 90 ? 0.85 :
    pitcher.stamina >= 80 ? 0.9 :
    pitcher.stamina >= 70 ? 1 :
    pitcher.stamina >= 60 ? 1.08 : 1.15;
  return loss * factor;
};

const responsiblePitcherIdForRunner = (ctx: GameContext, runnerId: string, fallbackPitcher: PitcherData) => {
  if (runnerId === ctx.bases.first) return ctx.baseResponsibility.first ?? fallbackPitcher.id;
  if (runnerId === ctx.bases.second) return ctx.baseResponsibility.second ?? fallbackPitcher.id;
  if (runnerId === ctx.bases.third) return ctx.baseResponsibility.third ?? fallbackPitcher.id;
  return fallbackPitcher.id;
};

const findPitcherById = (ctx: GameContext, pitcherId: string) =>
  ctx.away.pitchers.concat(ctx.home.pitchers).find((p) => p.id === pitcherId);

const addRun = (ctx: GameContext, scoringTeam: TeamState, runnerId: string, rbiBatter: BatterData | null, currentPitcher: PitcherData) => {
  ctx.scoredThisPlay.push(runnerId);
  if (scoringTeam.id === ctx.away.id) ctx.awayScore += 1;
  else ctx.homeScore += 1;

  const runner = scoringTeam.batters.find((b) => b.id === runnerId);
  if (runner) {
    runner.stats.runs += 1;
    addContribution(runner, 0.7);
  }

  if (rbiBatter) {
    rbiBatter.stats.rbi += 1;
    addContribution(rbiBatter, 1);
  }

  // 실점 책임은 "득점한 주자를 출루시킨 투수"에게 준다.
  // 타자 주자는 현재 투수 책임이고, 기존 주자는 baseResponsibility에 저장된 투수 책임이다.
  const responsiblePitcherId = responsiblePitcherIdForRunner(ctx, runnerId, currentPitcher);
  const pitcher = findPitcherById(ctx, responsiblePitcherId) ?? currentPitcher;
  pitcher.stats.earnedRuns += 1;
  const line = [...(ctx.livePitchers[pitcher.teamId] ?? [])].reverse().find((item) => item.pitcherId === pitcher.id);
  if (line) {
    line.runs += 1;
    const defense = pitcher.teamId === ctx.away.id ? ctx.away : ctx.home;
    const leadAfterRun = scoreDiffForDefense(ctx, defense);
    if (line.enteredWithLead > 0 && leadAfterRun <= 0) {
      line.lostLeadDuringAppearance = true;
      if (line.enteredSaveSituation && !line.blownSaveRecorded && pitcher.role !== "SP") {
        pitcher.stats.blownSaves += 1;
        addContribution(pitcher, -3.5);
        line.blownSaveRecorded = true;
      }
    }
  }

  ctx.scoringEvents.push({
    runNoForWinnerCandidate: scoringTeam.id === ctx.away.id ? ctx.awayScore : ctx.homeScore,
    scoringTeamId: scoringTeam.id,
    pitcherId: pitcher.id,
  });
};

const advanceOnWalk = (ctx: GameContext, batter: BatterData, pitcher: PitcherData) => {
  let runs = 0;
  if (ctx.bases.first && ctx.bases.second && ctx.bases.third) {
    addRun(ctx, ctx.offense, ctx.bases.third, batter, pitcher);
    runs += 1;
  }
  if (ctx.bases.first && ctx.bases.second) {
    ctx.bases.third = ctx.bases.second;
    ctx.baseResponsibility.third = ctx.baseResponsibility.second;
  }
  if (ctx.bases.first) {
    ctx.bases.second = ctx.bases.first;
    ctx.baseResponsibility.second = ctx.baseResponsibility.first;
  }
  ctx.bases.first = batter.id;
  ctx.baseResponsibility.first = pitcher.id;
  return runs;
};

const advanceOnHit = (ctx: GameContext, batter: BatterData, pitcher: PitcherData, bases: number) => {
  let runs = 0;
  let stopWalkOffScoring = false;
  const scoreRunner = (runnerId: string | null) => {
    if (!runnerId || stopWalkOffScoring) return;
    addRun(ctx, ctx.offense, runnerId, batter, pitcher);
    runs += 1;
    // 끝내기 안타/볼넷은 승리 주자가 들어오는 순간 종료한다. 단, 끝내기 홈런은 모든 주자를 인정한다.
    if (bases !== 4 && isWalkOffState(ctx)) stopWalkOffScoring = true;
  };

  if (bases === 4) {
    scoreRunner(ctx.bases.third);
    scoreRunner(ctx.bases.second);
    scoreRunner(ctx.bases.first);
    scoreRunner(batter.id);
    ctx.bases = emptyBases();
    ctx.baseResponsibility = emptyBaseResponsibility();
    return runs;
  }

  if (bases === 3) {
    const firstRunner = ctx.bases.first;
    scoreRunner(ctx.bases.third);
    scoreRunner(ctx.bases.second);
    scoreRunner(firstRunner);
    ctx.bases = { first: null, second: null, third: batter.id };
    ctx.baseResponsibility = { first: null, second: null, third: pitcher.id };
    return runs;
  }

  if (bases === 2) {
    const firstRunner = ctx.bases.first;
    const firstResp = ctx.baseResponsibility.first;
    scoreRunner(ctx.bases.third);
    scoreRunner(ctx.bases.second);
    let firstScored = false;
    if (firstRunner && !stopWalkOffScoring) {
      const runner = ctx.offense.batters.find((b) => b.id === firstRunner);
      if (runner && Math.random() < pct(0.35 + (runner.speed - 70) * 0.006)) {
        scoreRunner(firstRunner);
        firstScored = true;
      }
    }
    ctx.bases.first = null;
    ctx.baseResponsibility.first = null;
    ctx.bases.second = batter.id;
    ctx.baseResponsibility.second = pitcher.id;
    ctx.bases.third = firstRunner && !firstScored && !stopWalkOffScoring ? firstRunner : null;
    ctx.baseResponsibility.third = firstRunner && !firstScored && !stopWalkOffScoring ? firstResp : null;
    return runs;
  }

  // single
  const firstRunner = ctx.bases.first;
  const firstResp = ctx.baseResponsibility.first;
  scoreRunner(ctx.bases.third);
  if (ctx.bases.second && !stopWalkOffScoring) scoreRunner(ctx.bases.second);
  ctx.bases.third = null;
  ctx.baseResponsibility.third = null;
  ctx.bases.second = null;
  ctx.baseResponsibility.second = null;
  if (firstRunner && !stopWalkOffScoring) {
    const runner = ctx.offense.batters.find((b) => b.id === firstRunner);
    if (runner && Math.random() < pct(0.25 + (runner.speed - 70) * 0.006)) {
      ctx.bases.third = firstRunner;
      ctx.baseResponsibility.third = firstResp;
    } else {
      ctx.bases.second = firstRunner;
      ctx.baseResponsibility.second = firstResp;
    }
  }
  ctx.bases.first = batter.id;
  ctx.baseResponsibility.first = pitcher.id;
  return runs;
};
const resultToBases = (kind: PlayKind) => {
  if (kind === "SINGLE") return 1;
  if (kind === "DOUBLE") return 2;
  if (kind === "TRIPLE") return 3;
  if (kind === "HOMER") return 4;
  return 0;
};

const markOut = (ctx: GameContext, pitcher: PitcherData, count = 1) => {
  ctx.outs = Math.min(3, ctx.outs + count);
  pitcher.stats.outs += count;
  const line = ctx.livePitchers[pitcher.teamId][ctx.livePitchers[pitcher.teamId].length - 1];
  if (line) line.outs += count;
};

const addLog = (ctx: GameContext, partial: Omit<PlayLog, "id" | "inning" | "half" | "offenseTeamId" | "defenseTeamId" | "awayScore" | "homeScore" | "basesAfter" | "scoredRunnerIds">) => {
  const log: PlayLog = {
    ...partial,
    id: `${ctx.summary.id}-P${ctx.summary.logs.length + 1}`,
    inning: ctx.inning,
    half: ctx.half,
    offenseTeamId: ctx.offense.id,
    defenseTeamId: ctx.defense.id,
    awayScore: ctx.awayScore,
    homeScore: ctx.homeScore,
    basesAfter: { ...ctx.bases },
    scoredRunnerIds: [...ctx.scoredThisPlay],
  };
  ctx.summary.logs.push(log);
};

const importantMultiplier = (ctx: GameContext) => {
  let m = ctx.inning <= 3 ? 1 : ctx.inning <= 6 ? 1.15 : ctx.inning <= 8 ? 1.35 : 1.6;
  const diff = Math.abs(ctx.awayScore - ctx.homeScore);
  if (diff <= 1) m *= 1.25;
  else if (diff <= 3) m *= 1.1;
  if (ctx.bases.second || ctx.bases.third) m *= 1.15;
  if (ctx.bases.first && ctx.bases.second && ctx.bases.third) m *= 1.25;
  return m;
};

const playPlateAppearance = (ctx: GameContext, battersFacedInInning: number) => {
  maybeChangePitcher(ctx, ctx.defense);
  const batter = getNextBatter(ctx.offense);
  const pitcher = ctx.currentPitcher[ctx.defense.id];

  const outsBefore = ctx.outs;
  const basesBefore = { ...ctx.bases };
  ctx.scoredThisPlay = [];

  // 전체 리그가 투고타저로 치우치지 않도록 타격 확률을 상향하고 삼진 확률을 낮췄다.
  //볼넷/삼진/ /안타
  const walkProb = pct(0.084 + (batter.discipline - 70) * 0.0019 - (pitcher.control - 70) * 0.0022);
  const kProb = pct(0.18 + (pitcher.stuff - 70) * 0.00175 - (battingAvoidK(batter) - 70) * 0.0025);
  const clutchBonus = (ctx.bases.second || ctx.bases.third) ? (batter.clutch - pitcher.crisis) * 0.00135 : 0;
  const hitProb = pct(0.313 + (batter.contact - 70) * 0.00265 - (pitcher.stuff - 70) * 0.00155 + clutchBonus);

  let kind: PlayKind;
  let result: string;
  let runs = 0;
  let rbi = 0;
  let highlight = 0;
  const contribution: Record<string, number> = {};
  const r = Math.random();

  batter.stats.plateAppearances += 1;

  if (r < walkProb) {
    kind = "WALK";
    result = "볼넷";
    batter.stats.walks += 1;
    pitcher.stats.walks += 1;
    runs = advanceOnWalk(ctx, batter, pitcher);
    rbi = runs;
    contribution[batter.id] = 0.8 + runs;
    contribution[pitcher.id] = -0.65 - runs * 1.9;
  } else if (r < walkProb + kProb) {
    kind = "STRIKEOUT";
    result = "삼진";
    batter.stats.atBats += 1;
    batter.stats.strikeouts += 1;
    pitcher.stats.strikeouts += 1;
    markOut(ctx, pitcher, 1);
    contribution[batter.id] = -0.6;
    contribution[pitcher.id] = 0.9;
    highlight = countBases(basesBefore) >= 2 ? 4 : 2;
    if (basesBefore.first && basesBefore.second && basesBefore.third) highlight += 2;
  } else if (Math.random() < hitProb) {
    const hit = hitResult(batter, pitcher);
    kind = hit.kind;
    result = hit.result;
    const baseCount = resultToBases(kind);
    batter.stats.atBats += 1;
    batter.stats.hits += 1;
    if (kind === "DOUBLE") batter.stats.doubles += 1;
    if (kind === "TRIPLE") batter.stats.triples += 1;
    if (kind === "HOMER") batter.stats.homeRuns += 1;
    pitcher.stats.hitsAllowed += 1;
    if (kind === "HOMER") pitcher.stats.homeRunsAllowed += 1;
    runs = advanceOnHit(ctx, batter, pitcher, baseCount);
    rbi = kind === "HOMER" ? runs : runs;
    const hitScore = kind === "SINGLE" ? 1.2 : kind === "DOUBLE" ? 2 : kind === "TRIPLE" ? 3 : 4.5;
    contribution[batter.id] = hitScore + rbi + runs * 0.7;
    contribution[pitcher.id] = (kind === "SINGLE" ? -0.55 : kind === "DOUBLE" ? -0.9 : kind === "TRIPLE" ? -1.15 : -2.3) - runs * 1.9;
    highlight = (kind === "SINGLE" ? 2 : kind === "DOUBLE" ? 3 : kind === "TRIPLE" ? 4 : 6) + rbi * 1.5;
  } else {
    const out = outResult(pitcher);
    kind = out.kind;
    result = out.result;

    const isOutfieldFly = kind === "FLYOUT";
    const sacFly = isOutfieldFly && ctx.outs <= 1 && Boolean(ctx.bases.third);
    const doublePlayChance = pct(0.18 + (pitcher.stuff - 70) * 0.0012 - (batter.speed - 70) * 0.002);
    const doublePlay = kind === "GROUNDOUT" && ctx.outs <= 1 && Boolean(ctx.bases.first) && Math.random() < doublePlayChance;

    if (sacFly) {
      kind = "SAC_FLY";
      result = result.replace("뜬공", "희생플라이");
      batter.stats.sacFlies += 1;
      const runner = ctx.bases.third;
      if (runner) addRun(ctx, ctx.offense, runner, batter, pitcher);
      ctx.bases.third = null;
      ctx.baseResponsibility.third = null;
      runs = 1;
      rbi = 1;
      markOut(ctx, pitcher, 1);
      contribution[batter.id] = 1.2;
      contribution[pitcher.id] = -1.25;
      highlight = 2.5;
    } else if (doublePlay) {
      kind = "DOUBLE_PLAY";
      result = result.replace("땅볼", "병살타");
      batter.stats.atBats += 1;
      batter.stats.gidp += 1;
      ctx.bases.first = null;
      ctx.baseResponsibility.first = null;
      markOut(ctx, pitcher, 2);
      contribution[batter.id] = -1.8;
      contribution[pitcher.id] = 1.55;
      highlight = 3;
    } else {
      batter.stats.atBats += 1;
      markOut(ctx, pitcher, 1);
      contribution[batter.id] = kind === "INFIELD_FLY" ? -0.3 : -0.25;
      contribution[pitcher.id] = 0.35;
    }
  }

  const wasRisp = Boolean(basesBefore.second || basesBefore.third);
  if (wasRisp && atBatKinds.includes(kind)) {
    batter.stats.rispAtBats += 1;
    if (hitKinds.includes(kind)) batter.stats.rispHits += 1;
  }

  Object.entries(contribution).forEach(([id, score]) => {
    ctx.batterGameScore[id] = (ctx.batterGameScore[id] ?? 0) + (id.includes("-B-") ? score : 0);
    ctx.pitcherGameScore[id] = (ctx.pitcherGameScore[id] ?? 0) + (id.includes("-P-") ? score : 0);
    const batterTarget = ctx.away.batters.concat(ctx.home.batters).find((b) => b.id === id);
    const pitcherTarget = ctx.away.pitchers.concat(ctx.home.pitchers).find((p) => p.id === id);
    if (batterTarget) addContribution(batterTarget, score);
    if (pitcherTarget) addContribution(pitcherTarget, score);
  });

  const loss = applyStaminaModifier(pitcher, fatigueLoss(kind, runs, battersFacedInInning));
  ctx.pitcherEnergy[pitcher.id] = (ctx.pitcherEnergy[pitcher.id] ?? pitcher.stamina) - loss;

  const multiplier = importantMultiplier(ctx);
  highlight *= multiplier;

  const isWalkOff = runs > 0 && isWalkOffState(ctx);
  if (isWalkOff) {
    result = `끝내기 ${result}`;
    highlight += 14;
    contribution[batter.id] = (contribution[batter.id] ?? 0) + 6;
    ctx.batterGameScore[batter.id] = (ctx.batterGameScore[batter.id] ?? 0) + 6;
    const batterTarget = ctx.away.batters.concat(ctx.home.batters).find((b) => b.id === batter.id);
    if (batterTarget) addContribution(batterTarget, 6);
  }

  const message = `${ctx.inning}회${ctx.half} ${batter.name}: ${result}${runs > 0 ? `! ${runs}득점` : "!"}`;
  addLog(ctx, {
    batterId: batter.id,
    batterName: batter.name,
    pitcherId: pitcher.id,
    pitcherName: pitcher.name,
    result,
    kind,
    message,
    zone: getZoneForResult(result, kind),
    outsBefore,
    outsAfter: ctx.outs,
    runsScored: runs,
    rbi,
    actualClass: "Batter",
    parentClass: "BaseballPlayer",
    methodCalled: "play()",
    oopMessage: "같은 play() 메서드가 호출되지만 실제 객체가 Batter이므로 타격 결과가 출력됩니다.",
    highlightScore: highlight,
    contribution,
  });

  maybeChangePitcher(ctx, ctx.defense);
};

const playHalfInning = (ctx: GameContext) => {
  ctx.outs = 0;
  ctx.bases = emptyBases();
  ctx.baseResponsibility = emptyBaseResponsibility();
  let battersFaced = 0;

  maybeChangePitcher(ctx, ctx.defense);

  while (ctx.outs < 3) {
    battersFaced += 1;
    playPlateAppearance(ctx, battersFaced);
    if (isWalkOffState(ctx)) break;
  }

  const endedByWalkOff = isWalkOffState(ctx);
  ctx.summary.logs.push({
    id: `${ctx.summary.id}-I${ctx.inning}${ctx.half}`,
    inning: ctx.inning,
    half: ctx.half,
    offenseTeamId: ctx.offense.id,
    defenseTeamId: ctx.defense.id,
    batterId: "",
    batterName: endedByWalkOff ? "경기 종료" : "이닝 종료",
    pitcherId: "",
    pitcherName: "",
    result: endedByWalkOff ? "끝내기 경기 종료" : "공수교대",
    kind: "FLYOUT",
    message: endedByWalkOff ? `${ctx.inning}회${ctx.half} 홈팀이 리드를 잡아 경기 종료!` : `${ctx.inning}회${ctx.half} 종료. 공수교대!`,
    zone: "mound",
    outsBefore: 3,
    outsAfter: 3,
    awayScore: ctx.awayScore,
    homeScore: ctx.homeScore,
    runsScored: 0,
    rbi: 0,
    basesAfter: emptyBases(),
    actualClass: "GameEvent",
    parentClass: "BaseEvent",
    methodCalled: "apply()",
    oopMessage: "경기 이벤트 객체의 apply()가 실행되어 이닝 교체 메시지가 출력됩니다.",
    highlightScore: 0,
    contribution: {},
    scoredRunnerIds: [],
  });
};

const updateTeamRecords = (away: TeamState, home: TeamState, awayScore: number, homeScore: number) => {
  away.record.games += 1;
  home.record.games += 1;
  away.record.runsFor += awayScore;
  away.record.runsAgainst += homeScore;
  home.record.runsFor += homeScore;
  home.record.runsAgainst += awayScore;

  if (awayScore > homeScore) {
    away.record.wins += 1;
    home.record.losses += 1;
    recordRecent(away, "W");
    recordRecent(home, "L");
    updateHeadToHead(away, home.id, "W", awayScore, homeScore, false);
    updateHeadToHead(home, away.id, "L", homeScore, awayScore, true);
  } else if (awayScore < homeScore) {
    home.record.wins += 1;
    away.record.losses += 1;
    recordRecent(home, "W");
    recordRecent(away, "L");
    updateHeadToHead(home, away.id, "W", homeScore, awayScore, true);
    updateHeadToHead(away, home.id, "L", awayScore, homeScore, false);
  } else {
    away.record.draws += 1;
    home.record.draws += 1;
    recordRecent(away, "D");
    recordRecent(home, "D");
    updateHeadToHead(away, home.id, "D", awayScore, homeScore, false);
    updateHeadToHead(home, away.id, "D", homeScore, awayScore, true);
  }
};

const reliefLineQualifiesForSave = (line: LivePitcher, winPitcherId: string | null | undefined) => {
  if (!line || line.pitcherId === winPitcherId || line.outs < 1 || line.lostLeadDuringAppearance) return false;
  if (line.enteredWithLead <= 0) return false;
  // 3점 이하 리드로 등판해 1이닝 이상 마무리
  if (line.enteredWithLead <= 3 && line.outs >= 3) return true;
  // 동점 주자가 루상/타석/대기타석인 상황에서 등판한 경우는 1아웃 이상으로 인정
  if (line.enteredTyingRunSituation) return true;
  // 3이닝 이상 마무리
  if (line.outs >= 9) return true;
  return false;
};

const reliefLineQualifiesForHold = (line: LivePitcher, winPitcherId: string | null | undefined) => {
  if (!line || line.pitcherId === winPitcherId || line.outs < 1 || line.lostLeadDuringAppearance) return false;
  if (line.enteredWithLead <= 0) return false;
  if (line.enteredWithLead <= 3 && line.outs >= 3) return true;
  if (line.enteredTyingRunSituation) return true;
  if (line.outs >= 9) return true;
  return false;
};

const awardSimplePitchingDecisions = (ctx: GameContext) => {
  const winner = ctx.awayScore > ctx.homeScore ? ctx.away : ctx.homeScore > ctx.awayScore ? ctx.home : null;
  const loser = ctx.awayScore > ctx.homeScore ? ctx.home : ctx.homeScore > ctx.awayScore ? ctx.away : null;
  if (!winner || !loser) return;

  const winnerLines = ctx.livePitchers[winner.id];
  const loserLines = ctx.livePitchers[loser.id];
  const winnerStarter = winnerLines[0];
  const lastWinnerLine = winnerLines[winnerLines.length - 1];
  const lastWinnerPitcher = winner.pitchers.find((p) => p.id === lastWinnerLine?.pitcherId);
  const tentativeSavePitcherId = lastWinnerPitcher && lastWinnerPitcher.role !== "SP" && reliefLineQualifiesForSave(lastWinnerLine, null)
    ? lastWinnerPitcher.id
    : null;

  // 승리투수: 선발 5이닝 이상이면 선발, 아니면 세이브 후보를 제외한 승리팀 투수 중 세부 기여가 가장 큰 투수.
  let winPitcher = winner.pitchers.find((p) => p.id === winnerStarter?.pitcherId);
  if (!winnerStarter || winnerStarter.outs < 15) {
    const candidateLines = winnerLines.filter((line) => line.pitcherId !== tentativeSavePitcherId);
    const candidateIds = candidateLines.map((line) => line.pitcherId);
    winPitcher = winner.pitchers
      .filter((p) => candidateIds.includes(p.id))
      .sort((a, b) =>
        (ctx.pitcherGameScore[b.id] ?? 0) - (ctx.pitcherGameScore[a.id] ?? 0) ||
        (candidateLines.find((l) => l.pitcherId === b.id)?.outs ?? 0) - (candidateLines.find((l) => l.pitcherId === a.id)?.outs ?? 0)
      )[0] ?? winPitcher;
  }
  if (winPitcher) {
    winPitcher.stats.wins += 1;
    addContribution(winPitcher, 1.5);
  }

  // 패전투수: 최종 결승점을 허용한 투수. 정보가 부족하면 실점이 가장 많은 투수로 보정.
  const winnerFinalScore = winner.id === ctx.away.id ? ctx.awayScore : ctx.homeScore;
  const loserFinalScore = loser.id === ctx.away.id ? ctx.awayScore : ctx.homeScore;
  const decisiveRunNo = Math.min(winnerFinalScore, loserFinalScore + 1);
  const decisiveEvent = ctx.scoringEvents.find((event) => event.scoringTeamId === winner.id && event.runNoForWinnerCandidate === decisiveRunNo);
  const fallbackLossLine = [...loserLines].sort((a, b) => b.runs - a.runs || b.outs - a.outs)[0];
  const lossPitcher = loser.pitchers.find((p) => p.id === decisiveEvent?.pitcherId) ?? loser.pitchers.find((p) => p.id === fallbackLossLine?.pitcherId) ?? loser.pitchers[0];
  if (lossPitcher) {
    lossPitcher.stats.losses += 1;
    addContribution(lossPitcher, -2);
  }

  [winnerLines, loserLines].forEach((lines) => {
    const starterLine = lines[0];
    if (!starterLine) return;
    const team = starterLine.teamId === winner.id ? winner : loser;
    const starter = team.pitchers.find((p) => p.id === starterLine.pitcherId);
    if (starter && starterLine.outs >= 18 && starterLine.runs <= 3) {
      starter.stats.qualityStarts += 1;
      addContribution(starter, 4.0 + (starterLine.outs >= 21 ? 1.2 : 0));
    }
  });

  if (lastWinnerPitcher && lastWinnerPitcher.role !== "SP" && reliefLineQualifiesForSave(lastWinnerLine, winPitcher?.id)) {
    lastWinnerPitcher.stats.saves += 1;
    addContribution(lastWinnerPitcher, 4.0);
  }

  winnerLines.slice(1, -1).forEach((line) => {
    const p = winner.pitchers.find((pitcher) => pitcher.id === line.pitcherId);
    if (!p || p.id === winPitcher?.id || p.role === "SP") return;
    if (reliefLineQualifiesForHold(line, winPitcher?.id)) {
      p.stats.holds += 1;
      addContribution(p, 2.4);
    }
  });
};
const finalizeGameSummary = (ctx: GameContext, game: ScheduleGame) => {
  const winnerTeamId = ctx.awayScore > ctx.homeScore ? ctx.away.id : ctx.homeScore > ctx.awayScore ? ctx.home.id : null;
  const loserTeamId = ctx.awayScore > ctx.homeScore ? ctx.home.id : ctx.homeScore > ctx.awayScore ? ctx.away.id : null;

  ctx.summary.awayScore = ctx.awayScore;
  ctx.summary.homeScore = ctx.homeScore;
  ctx.summary.winnerTeamId = winnerTeamId;
  ctx.summary.loserTeamId = loserTeamId;
  ctx.summary.isDraw = winnerTeamId === null;
  ctx.summary.innings = ctx.inning;

  const hitterPositiveKinds: PlayKind[] = ["WALK", "SINGLE", "DOUBLE", "TRIPLE", "HOMER", "SAC_FLY"];
  const pitcherPositiveKinds: PlayKind[] = ["STRIKEOUT", "GROUNDOUT", "FLYOUT", "INFIELD_FLY", "DOUBLE_PLAY"];
  const winnerLogs = winnerTeamId
    ? ctx.summary.logs.filter((l) =>
        (l.offenseTeamId === winnerTeamId && hitterPositiveKinds.includes(l.kind)) ||
        (l.defenseTeamId === winnerTeamId && pitcherPositiveKinds.includes(l.kind))
      )
    : ctx.summary.logs;
  ctx.summary.highlights = winnerLogs
    .filter((l) => l.highlightScore > 0)
    .sort((a, b) => b.highlightScore - a.highlightScore)
    .slice(0, 3);

  ctx.summary.highlights.forEach((h) => {
    const player =
      ctx.away.batters.concat(ctx.home.batters).find((b) => b.id === h.batterId) ??
      ctx.away.pitchers.concat(ctx.home.pitchers).find((p) => p.id === h.pitcherId);
    if (player) player.stats.highlights += 1;
  });

  const allScores = { ...ctx.batterGameScore, ...ctx.pitcherGameScore };
  const allPlayers = ctx.away.batters.concat(ctx.home.batters).concat(ctx.away.pitchers as any).concat(ctx.home.pitchers as any);
  if (winnerTeamId) {
    const winnerTeam = getTeam({ ...ctx.summary, teams: [ctx.away, ctx.home] } as unknown as SeasonState, winnerTeamId);
    const winnerPlayerIds = winnerTeam.batters.map((b) => b.id).concat(winnerTeam.pitchers.map((p) => p.id));
    const mvpId = winnerPlayerIds.sort((a, b) => (allScores[b] ?? -999) - (allScores[a] ?? -999))[0] ?? null;
    const mvp = allPlayers.find((p: BatterData | PitcherData) => p.id === mvpId);
    if (mvp) {
      mvp.stats.gameMvp += 1;
      ctx.summary.mvpPlayerId = mvp.id;
      ctx.summary.mvpName = mvp.name;
      ctx.summary.mvpTeamId = mvp.teamId;
    }
  }

  updateTeamRecords(ctx.away, ctx.home, ctx.awayScore, ctx.homeScore);
  awardSimplePitchingDecisions(ctx);

  ctx.summary.awayTeamName = ctx.away.name;
  ctx.summary.homeTeamName = ctx.home.name;
  ctx.summary.id = game.id;
};

export const simulateGame = (state: SeasonState, game: ScheduleGame): GameSummary => {
  const away = getTeam(state, game.awayTeamId);
  const home = getTeam(state, game.homeTeamId);

  away.batters.forEach((b) => { b.stats.games += 1; });
  home.batters.forEach((b) => { b.stats.games += 1; });

  const summary: GameSummary = {
    id: game.id,
    round: game.round,
    awayTeamId: away.id,
    homeTeamId: home.id,
    awayTeamName: away.name,
    homeTeamName: home.name,
    awayScore: 0,
    homeScore: 0,
    winnerTeamId: null,
    loserTeamId: null,
    isDraw: false,
    innings: 9,
    logs: [],
    highlights: [],
    mvpPlayerId: null,
    mvpName: null,
    mvpTeamId: null,
    events: [],
  };

  const ctx: GameContext = {
    summary,
    away,
    home,
    inning: 1,
    half: "초",
    offense: away,
    defense: home,
    outs: 0,
    bases: emptyBases(),
    baseResponsibility: emptyBaseResponsibility(),
    awayScore: 0,
    homeScore: 0,
    livePitchers: { [away.id]: [], [home.id]: [] },
    currentPitcher: {} as Record<TeamId, PitcherData>,
    pitcherEnergy: {},
    pitcherUsed: { [away.id]: [], [home.id]: [] },
    batterGameScore: {},
    pitcherGameScore: {},
    scoringEvents: [],
    scoredThisPlay: [],
  };

  installPitcher(ctx, away, chooseStartingPitcher(away));
  installPitcher(ctx, home, chooseStartingPitcher(home));

  for (let inning = 1; inning <= 12; inning += 1) {
    ctx.inning = inning;

    ctx.half = "초";
    ctx.offense = away;
    ctx.defense = home;
    playHalfInning(ctx);

    const homeLeadsAfterTop9 = inning >= 9 && ctx.homeScore > ctx.awayScore;
    if (homeLeadsAfterTop9) break;

    ctx.half = "말";
    ctx.offense = home;
    ctx.defense = away;
    playHalfInning(ctx);

    if (inning >= 9 && ctx.awayScore !== ctx.homeScore) break;
  }

  finalizeGameSummary(ctx, game);
  return summary;
};

export const playCurrentRound = (season: SeasonState) => {
  const next = clone(season);
  if (next.currentRound >= next.schedule.length) {
    next.seasonFinished = true;
    return { season: next, selectedGame: null as GameSummary | null, roundGames: [] as GameSummary[] };
  }

  const games = next.schedule[next.currentRound];
  const summaries = games.map((game) => simulateGame(next, game));
  const selectedGame = summaries.find((g) => g.awayTeamId === next.selectedTeamId || g.homeTeamId === next.selectedTeamId) ?? null;

  next.recentGames = [...summaries, ...next.recentGames].slice(0, 30);
  next.currentRound += 1;
  if (next.currentRound >= next.schedule.length) next.seasonFinished = true;
  next.lastSavedAt = new Date().toISOString();

  return { season: next, selectedGame, roundGames: summaries };
};

export const getBattingAverage = (b: BatterData) => b.stats.atBats === 0 ? 0 : b.stats.hits / b.stats.atBats;
export const getOnBasePercentage = (b: BatterData) => {
  const denom = b.stats.atBats + b.stats.walks + b.stats.sacFlies;
  return denom === 0 ? 0 : (b.stats.hits + b.stats.walks) / denom;
};
export const getSlugging = (b: BatterData) => {
  const singles = b.stats.hits - b.stats.doubles - b.stats.triples - b.stats.homeRuns;
  const totalBases = singles + b.stats.doubles * 2 + b.stats.triples * 3 + b.stats.homeRuns * 4;
  return b.stats.atBats === 0 ? 0 : totalBases / b.stats.atBats;
};
export const getOps = (b: BatterData) => getOnBasePercentage(b) + getSlugging(b);

export const getEra = (p: PitcherData) => p.stats.outs === 0 ? 0 : (p.stats.earnedRuns * 27) / p.stats.outs;
export const getInningsText = (outs: number) => `${Math.floor(outs / 3)}.${outs % 3}`;

export const getStandings = (season: SeasonState): StandingRow[] => {
  const rows = season.teams.map((team) => {
    const allBatters = team.batters;
    const allPitchers = team.pitchers;
    const atBats = allBatters.reduce((sum, b) => sum + b.stats.atBats, 0);
    const hits = allBatters.reduce((sum, b) => sum + b.stats.hits, 0);
    const walks = allBatters.reduce((sum, b) => sum + b.stats.walks, 0);
    const sf = allBatters.reduce((sum, b) => sum + b.stats.sacFlies, 0);
    const doubles = allBatters.reduce((sum, b) => sum + b.stats.doubles, 0);
    const triples = allBatters.reduce((sum, b) => sum + b.stats.triples, 0);
    const homeRuns = allBatters.reduce((sum, b) => sum + b.stats.homeRuns, 0);
    const singles = hits - doubles - triples - homeRuns;
    const totalBases = singles + doubles * 2 + triples * 3 + homeRuns * 4;
    const outs = allPitchers.reduce((sum, p) => sum + p.stats.outs, 0);
    const er = allPitchers.reduce((sum, p) => sum + p.stats.earnedRuns, 0);
    const strikeouts = allPitchers.reduce((sum, p) => sum + p.stats.strikeouts, 0);
    const wins = team.record.wins;
    const losses = team.record.losses;
    const winRate = wins + losses === 0 ? 0 : wins / (wins + losses);
    const obpDenom = atBats + walks + sf;
    const obp = obpDenom === 0 ? 0 : (hits + walks) / obpDenom;
    const slg = atBats === 0 ? 0 : totalBases / atBats;

    return {
      rank: 0,
      team,
      winRate,
      gamesBehind: 0,
      teamAvg: atBats === 0 ? 0 : hits / atBats,
      teamEra: outs === 0 ? 0 : (er * 27) / outs,
      obp,
      slg,
      ops: obp + slg,
      teamHomeRuns: homeRuns,
      teamStrikeouts: strikeouts,
    };
  }).sort((a, b) =>
    b.winRate - a.winRate ||
    b.team.record.wins - a.team.record.wins ||
    (b.team.record.runsFor - b.team.record.runsAgainst) - (a.team.record.runsFor - a.team.record.runsAgainst)
  );

  const leader = rows[0];
  rows.forEach((row, index) => {
    row.rank = index + 1;
    row.gamesBehind = leader ? ((leader.team.record.wins - row.team.record.wins) + (row.team.record.losses - leader.team.record.losses)) / 2 : 0;
  });

  return rows;
};

export const getAllBatters = (season: SeasonState) => season.teams.flatMap((t) => t.batters.map((b) => ({ ...b, teamName: t.shortName })));
export const getAllPitchers = (season: SeasonState) => season.teams.flatMap((t) => t.pitchers.map((p) => ({ ...p, teamName: t.shortName })));

export const formatRate = (value: number) => value === 0 ? "0.000" : value.toFixed(3);
export const formatEra = (value: number) => value === 0 ? "0.00" : value.toFixed(2);