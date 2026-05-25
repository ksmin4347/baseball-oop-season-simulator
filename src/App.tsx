import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { clearSeason, loadSeason, saveSeason } from "./storage";
import {
  createNewSeason,
  formatEra,
  formatRate,
  getAllBatters,
  getAllPitchers,
  getBattingAverage,
  getEra,
  getInningsText,
  getOnBasePercentage,
  getOps,
  getSlugging,
  getStandings,
  playCurrentRound,
} from "./engine";
import { makePolymorphismText } from "./models";
import type { BatterData, GameSummary, PitcherData, PlayKind, PlayLog, SeasonState, SimulationMode, TeamState } from "./types";

type ActivePanel = "boxscore" | "team" | "players" | "awards" | null;
type OopNodeKey = "PlayerADT" | "BaseballPlayer" | "Batter" | "Pitcher";
type PlayerLookup =
  | { kind: "batter"; player: BatterData; team: TeamState }
  | { kind: "pitcher"; player: PitcherData; team: TeamState };

const zoneClass = (zone: string) => `ball ball-${zone}`;
const hitKinds: PlayKind[] = ["SINGLE", "DOUBLE", "TRIPLE", "HOMER"];
const atBatKinds: PlayKind[] = ["SINGLE", "DOUBLE", "TRIPLE", "HOMER", "STRIKEOUT", "GROUNDOUT", "FLYOUT", "INFIELD_FLY", "DOUBLE_PLAY"];

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);
const round1 = (n: number) => n.toFixed(1);
const formatNum = (n: number) => Number.isFinite(n) ? n.toFixed(2) : "0.00";
const formatWinRate = (w: number, l: number) => (w + l === 0 ? "0.000" : (w / (w + l)).toFixed(3));
const inningsNumber = (outs: number) => outs / 3;
const totalBases = (b: BatterData) => {
  const singles = b.stats.hits - b.stats.doubles - b.stats.triples - b.stats.homeRuns;
  return singles + b.stats.doubles * 2 + b.stats.triples * 3 + b.stats.homeRuns * 4;
};
const batterOuts = (b: BatterData) => Math.max(0, b.stats.atBats - b.stats.hits + b.stats.sacFlies + b.stats.gidp);
const rc27 = (b: BatterData) => {
  const h = b.stats.hits;
  const bb = b.stats.walks;
  const tb = totalBases(b);
  const sf = b.stats.sacFlies;
  const denom = b.stats.atBats + bb + sf;
  const outs = batterOuts(b);
  if (denom === 0 || outs === 0) return 0;
  const rc = ((h + bb) * (tb + 0.26 * bb + 0.52 * sf)) / denom;
  return rc * 27 / outs;
};
const pitcherAtBatsAgainst = (p: PitcherData) => p.stats.outs + p.stats.hitsAllowed;
const pitcherWhip = (p: PitcherData) => safeDiv(p.stats.hitsAllowed + p.stats.walks, inningsNumber(p.stats.outs));
const pitcherAvgAllowed = (p: PitcherData) => safeDiv(p.stats.hitsAllowed, pitcherAtBatsAgainst(p));
const pitcherKbb = (p: PitcherData) => p.stats.walks === 0 ? p.stats.strikeouts : p.stats.strikeouts / p.stats.walks;
const pitcherAvgInnings = (p: PitcherData) => safeDiv(inningsNumber(p.stats.outs), p.stats.games);
const formatAverageInningsText = (p: PitcherData) => {
  if (!p.stats.games) return "0.0";
  const avgOuts = Math.round(p.stats.outs / p.stats.games);
  return `${Math.floor(avgOuts / 3)}.${avgOuts % 3}`;
};

const recentText = (team: TeamState) => {
  const recent = team.record.recent.slice(0, 10);
  if (recent.length === 0) return "-";
  const w = recent.filter((r) => r === "W").length;
  const d = recent.filter((r) => r === "D").length;
  const l = recent.filter((r) => r === "L").length;
  return `${w}승 ${d}무 ${l}패`;
};

const streakText = (team: TeamState) => {
  if (!team.record.streakType) return "-";
  const label = team.record.streakType === "W" ? "승" : team.record.streakType === "L" ? "패" : "무";
  return `${team.record.streakCount}${label}`;
};

const findPlayer = (season: SeasonState, playerId: string | null): PlayerLookup | null => {
  if (!playerId) return null;
  for (const team of season.teams) {
    const batter = team.batters.find((b) => b.id === playerId);
    if (batter) return { kind: "batter", player: batter, team };
    const pitcher = team.pitchers.find((p) => p.id === playerId);
    if (pitcher) return { kind: "pitcher", player: pitcher, team };
  }
  return null;
};

const hexToRgb = (hex: string) => {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return { r: 96, g: 165, b: 250 };
  return { r: parseInt(raw.slice(0, 2), 16), g: parseInt(raw.slice(2, 4), 16), b: parseInt(raw.slice(4, 6), 16) };
};
const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
const rgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const teamAccentColor = (team: Pick<TeamState, "id" | "primaryColor" | "secondaryColor">) => {
  if (team.id === "kt") return "#94a3b8";
  if (team.id === "doosan") return "#9ca3af";
  if (team.id === "nc") return "#fbbf24";
  if (luminance(team.primaryColor) > 0.82) return team.secondaryColor || "#ef4444";
  return team.primaryColor;
};
const teamTextStyle = (team?: Pick<TeamState, "id" | "primaryColor" | "secondaryColor" | "shortName"> | null): CSSProperties | undefined => {
  if (!team) return undefined;
  const accent = teamAccentColor(team);
  const bgBase = luminance(team.primaryColor) < 0.28 ? team.primaryColor : accent;
  return {
    color: luminance(accent) > 0.76 ? "#111827" : accent,
    background: luminance(team.primaryColor) < 0.28 ? rgba(bgBase, 0.58) : rgba(accent, 0.14),
    borderColor: rgba(accent, 0.55),
  };
};
const teamThemeVars = (team: TeamState): CSSProperties => {
  const accent = teamAccentColor(team);
  return {
    "--team-primary": team.primaryColor,
    "--team-secondary": team.secondaryColor,
    "--team-accent": accent,
    "--team-accent-soft": rgba(accent, 0.18),
    "--team-button-text": luminance(accent) > 0.76 ? "#111827" : "#f8fafc",
  } as CSSProperties;
};

const TeamTag = ({ team, shortName }: { team?: Pick<TeamState, "id" | "primaryColor" | "secondaryColor" | "shortName"> | null; shortName?: string }) => (
  <span className="team-color-name" style={teamTextStyle(team)}>{shortName ?? team?.shortName ?? "-"}</span>
);

const TeamSelect = ({ season, onSelect }: { season: SeasonState; onSelect: (teamId: string, mode: Exclude<SimulationMode, null>) => void }) => {
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const pendingTeam = season.teams.find((team) => team.id === pendingTeamId) ?? null;

  return (
    <main className="screen">
      <section className="hero">
        <div>
          <p className="eyebrow">Data Structures Assignment 2</p>
          <h1>Baseball OOP Season Simulator</h1>
          <p>OOP 상속 구조와 다형성을 바탕으로 만든 10개 팀 야구 시즌 시뮬레이션 웹앱입니다. 팀을 선택하면 144경기 시즌을 시작합니다.</p>
          <p className="data-notice">선수들의 스탯은 KBO리그 2026년 5월 24일 기준 성적과 팀 전력표를 바탕으로 설정되었습니다.</p>
          <p className="student-notice">숭실대학교 IT대학 컴퓨터학부 20233164 최현민</p>
        </div>
      </section>

      <section className="team-grid">
        {season.teams.map((team) => (
          <button
            key={team.id}
            className="team-card"
            onClick={() => setPendingTeamId(team.id)}
            style={{ borderColor: team.primaryColor, "--team-color": team.primaryColor } as CSSProperties}
          >
            <span className="team-badge" style={{ background: team.primaryColor, color: team.secondaryColor }}>{team.shortName}</span>
            <h2>{team.name}</h2>
            <p>{team.region} · {team.stadium}</p>
            <div className="mini-metrics"><span>타자 9명</span><span>투수 13명</span><span>144경기</span></div>
          </button>
        ))}
      </section>

      {pendingTeam && createPortal(
        <div className="modal-backdrop" onClick={() => setPendingTeamId(null)}>
          <div className="modal mode-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPendingTeamId(null)} aria-label="닫기">×</button>
            <div className="section-title modal-title">
              <h2>{pendingTeam.name} 선택</h2>
              <span>{pendingTeam.region} · {pendingTeam.stadium}</span>
            </div>
            <div className="team-color-preview" style={{ background: `linear-gradient(135deg, ${pendingTeam.primaryColor}55, rgba(15,23,42,.96))` }}>
              <b>{pendingTeam.shortName}</b>
              <span>선택한 팀 색상이 시즌 대시보드 배경에 반영됩니다.</span>
            </div>
            <p className="muted">시즌 시작 방식을 선택하세요. 과제 제출용 OOP 구조와 다형성 기능은 두 방식 모두 동일하게 유지됩니다.</p>
            <div className="mode-grid">
              <button className="mode-card" onClick={() => onSelect(pendingTeam.id, "REALISTIC")}>
                <b>2026 KBO 리그 반영 시뮬레이션</b>
                <span>팀 전력표와 라인업/역할별 능력치를 그대로 사용합니다.</span>
              </button>
              <button className="mode-card primary-mode" onClick={() => onSelect(pendingTeam.id, "USER_BOOST")}>
                <b>사용자 팀 능력 소폭 상승 모드</b>
                <span>선택한 팀의 모든 선수 능력치를 아주 조금 올려 더 즐겁게 체험합니다.</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
};

const OOPDiagram = ({ currentLog }: { currentLog?: PlayLog }) => {
  const [selectedNode, setSelectedNode] = useState<OopNodeKey>("Batter");
  const consoleData = makePolymorphismText(currentLog);
  const nodeResults: Record<OopNodeKey, { role: string; method: string; result: string; description: string }> = {
    PlayerADT: {
      role: "추상 ADT 클래스",
      method: "play() / showInfo() 인터페이스 정의",
      result: "직접 객체를 만들 수 없고, 하위 클래스가 반드시 구현해야 하는 약속을 제공합니다.",
      description: "Python 원본의 PlayerADT처럼 name, position, play(), show_info()를 공통 규격으로 정의합니다.",
    },
    BaseballPlayer: {
      role: "공통 부모 클래스",
      method: "BaseballPlayer.play()",
      result: "선수 공통 정보와 기본 플레이 동작을 제공합니다.",
      description: "Batter와 Pitcher가 공유하는 이름, 포지션, 팀 정보를 관리하는 Base class입니다.",
    },
    Batter: {
      role: "타자 클래스",
      method: "Batter.play() 오버라이딩",
      result: currentLog?.actualClass === "Batter" ? currentLog.result : "예시 실행 결과: 좌중간 2루타 또는 홈런",
      description: "Batter 노드를 클릭하면 같은 play()라도 타격 결과를 만드는 방식으로 실행됩니다.",
    },
    Pitcher: {
      role: "투수 클래스",
      method: "Pitcher.play() 오버라이딩",
      result: currentLog ? `${currentLog.pitcherName} 투구 결과 반영` : "예시 실행 결과: 삼진 유도 또는 땅볼 유도",
      description: "Pitcher 노드를 클릭하면 같은 play()라도 투구 결과와 투수 기록에 영향을 주는 방식으로 실행됩니다.",
    },
  };
  const selected = nodeResults[selectedNode];

  const NodeButton = ({ keyName, className, children }: { keyName: OopNodeKey; className: string; children: ReactNode }) => (
    <button type="button" className={`${className} ${selectedNode === keyName ? "selected-node" : ""}`} onClick={() => setSelectedNode(keyName)}>{children}</button>
  );

  return (
    <section className="panel oop-panel">
      <div className="section-title"><h2>OOP 필수 기능</h2><span>상속 구조 노드 클릭 + 다형성 실행 결과</span></div>
      <p className="oop-help">아래 클래스 노드를 직접 클릭하면 해당 클래스의 역할과 오버라이딩된 메서드 실행 결과가 화면에 출력됩니다.</p>
      <div className="diagram">
        <NodeButton keyName="PlayerADT" className="node abstract">PlayerADT<br /><small>name / position / play()</small></NodeButton>
        <div className="arrow">↓</div>
        <NodeButton keyName="BaseballPlayer" className="node base">BaseballPlayer<br /><small>공통 선수 정보</small></NodeButton>
        <div className="arrow">↓</div>
        <div className="children">
          <NodeButton keyName="Batter" className="node child">Batter<br /><small>play() 오버라이딩</small></NodeButton>
          <NodeButton keyName="Pitcher" className="node child">Pitcher<br /><small>play() 오버라이딩</small></NodeButton>
        </div>
      </div>
      <div className="console node-console">
        <p><b>클릭한 노드</b> {selectedNode}</p>
        <p><b>클래스 역할</b> {selected.role}</p>
        <p><b>호출 메서드</b> {selected.method}</p>
        <p><b>실행 결과</b> {selected.result}</p>
        <p className="console-desc">{selected.description}</p>
      </div>
      <div className="console">
        <p><b>현재 객체</b> {consoleData.currentObject}</p>
        <p><b>부모 클래스</b> {consoleData.parentClass}</p>
        <p><b>실제 클래스</b> {consoleData.actualClass}</p>
        <p><b>호출 메서드</b> {consoleData.methodCalled}</p>
        <p><b>실행 결과</b> {consoleData.result}</p>
        <p className="console-desc">{consoleData.description}</p>
      </div>
    </section>
  );
};

const StandingsTable = ({ season }: { season: SeasonState }) => {
  const rows = getStandings(season);
  return (
    <section className="panel wide-table">
      <div className="section-title"><h2>팀 순위</h2><span>승률 · 게임차 · 팀 기록</span></div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>순위</th><th>팀</th><th>승률</th><th>경기수</th><th>승</th><th>무</th><th>패</th><th>게임차</th><th>연속</th><th>팀타율</th><th>ERA</th><th>최근10</th><th>득점</th><th>실점</th><th>HR</th><th>OBP</th><th>SLG</th><th>OPS</th><th>K</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.team.id}>
                <td>{row.rank}</td><td className="team-name-cell"><TeamTag team={row.team} /></td><td>{formatRate(row.winRate)}</td><td>{row.team.record.games}</td><td>{row.team.record.wins}</td><td>{row.team.record.draws}</td><td>{row.team.record.losses}</td><td>{row.gamesBehind.toFixed(1)}</td><td>{streakText(row.team)}</td><td>{formatRate(row.teamAvg)}</td><td>{formatEra(row.teamEra)}</td><td>{recentText(row.team)}</td><td>{row.team.record.runsFor}</td><td>{row.team.record.runsAgainst}</td><td>{row.teamHomeRuns}</td><td>{formatRate(row.obp)}</td><td>{formatRate(row.slg)}</td><td>{formatRate(row.ops)}</td><td>{row.teamStrikeouts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const RankBox = ({ title, rows }: { title: string; rows: ReactNode[] }) => (
  <section className="rank-box compact-rank-box">
    <h3>{title}</h3>
    {rows.length === 0 ? <p className="muted">아직 기록 없음</p> : <ol>{rows.map((row, idx) => <li key={`${title}-${idx}`}>{row}</li>)}</ol>}
  </section>
);

const PlayerLink = ({ playerId, children, onPlayerClick }: { playerId: string; children: ReactNode; onPlayerClick: (id: string) => void }) => (
  <button type="button" className="link-button" onClick={() => onPlayerClick(playerId)}>{children}</button>
);

const PlayerRankings = ({ season, onPlayerClick }: { season: SeasonState; onPlayerClick: (id: string) => void }) => {
  const batters = getAllBatters(season);
  const pitchers = getAllPitchers(season);
  const teamMap = new Map(season.teams.map((team) => [team.id, team]));
  const top = 50;
  const rankBatters = (value: (b: BatterData & { teamName: string }) => number, reverse = true) => [...batters].sort((a, b) => reverse ? value(b) - value(a) : value(a) - value(b)).slice(0, top);
  const rankPitchers = (value: (p: PitcherData & { teamName: string }) => number, reverse = true) => [...pitchers].filter((p) => p.stats.outs > 0 || reverse).sort((a, b) => reverse ? value(b) - value(a) : value(a) - value(b)).slice(0, top);
  const inningsRequired = Math.max(1, season.currentRound);
  const qualifiedEraPitchers = [...pitchers].filter((p) => p.stats.outs >= inningsRequired * 3).sort((a, b) => getEra(a) - getEra(b)).slice(0, top);
  const qualifiedWhipPitchers = [...pitchers].filter((p) => p.stats.outs >= inningsRequired * 3).sort((a, b) => pitcherWhip(a) - pitcherWhip(b)).slice(0, top);
  const batterRow = (b: BatterData & { teamName: string }, value: ReactNode) => <><TeamTag team={teamMap.get(b.teamId)} shortName={b.teamName} /> <PlayerLink playerId={b.id} onPlayerClick={onPlayerClick}>{b.name}</PlayerLink> {value}</>;
  const pitcherRow = (p: PitcherData & { teamName: string }, value: ReactNode) => <><TeamTag team={teamMap.get(p.teamId)} shortName={p.teamName} /> <PlayerLink playerId={p.id} onPlayerClick={onPlayerClick}>{p.name}</PlayerLink> {value}</>;

  return (
    <section className="panel">
      <div className="section-title"><h2>선수 기록 순위</h2><span>각 부문 TOP 50 · 이름 클릭 시 세부 기록</span></div>
      <div className="rank-grid large-rank-grid">
        <RankBox title="타율" rows={rankBatters(getBattingAverage).map((b) => batterRow(b, formatRate(getBattingAverage(b))))} />
        <RankBox title="홈런" rows={rankBatters((b) => b.stats.homeRuns).map((b) => batterRow(b, b.stats.homeRuns))} />
        <RankBox title="안타" rows={rankBatters((b) => b.stats.hits).map((b) => batterRow(b, b.stats.hits))} />
        <RankBox title="2루타" rows={rankBatters((b) => b.stats.doubles).map((b) => batterRow(b, b.stats.doubles))} />
        <RankBox title="3루타" rows={rankBatters((b) => b.stats.triples).map((b) => batterRow(b, b.stats.triples))} />
        <RankBox title="타점" rows={rankBatters((b) => b.stats.rbi).map((b) => batterRow(b, b.stats.rbi))} />
        <RankBox title="득점" rows={rankBatters((b) => b.stats.runs).map((b) => batterRow(b, b.stats.runs))} />
        <RankBox title="볼넷" rows={rankBatters((b) => b.stats.walks).map((b) => batterRow(b, b.stats.walks))} />
        <RankBox title="출루율" rows={rankBatters(getOnBasePercentage).map((b) => batterRow(b, formatRate(getOnBasePercentage(b))))} />
        <RankBox title="장타율" rows={rankBatters(getSlugging).map((b) => batterRow(b, formatRate(getSlugging(b))))} />
        <RankBox title="OPS" rows={rankBatters(getOps).map((b) => batterRow(b, formatRate(getOps(b))))} />
        <RankBox title="득점권타율" rows={rankBatters((b) => safeDiv(b.stats.rispHits, b.stats.rispAtBats)).map((b) => batterRow(b, formatRate(safeDiv(b.stats.rispHits, b.stats.rispAtBats))))} />
        <RankBox title="순출루율" rows={rankBatters((b) => getOnBasePercentage(b) - getBattingAverage(b)).map((b) => batterRow(b, formatRate(getOnBasePercentage(b) - getBattingAverage(b))))} />
        <RankBox title="순장타율" rows={rankBatters((b) => getSlugging(b) - getBattingAverage(b)).map((b) => batterRow(b, formatRate(getSlugging(b) - getBattingAverage(b))))} />
        <RankBox title={`평균자책점 · 규정 ${inningsRequired}이닝`} rows={qualifiedEraPitchers.map((p) => pitcherRow(p, formatEra(getEra(p))))} />
        <RankBox title="경기수" rows={rankPitchers((p) => p.stats.games).map((p) => pitcherRow(p, p.stats.games))} />
        <RankBox title="승리" rows={rankPitchers((p) => p.stats.wins).map((p) => pitcherRow(p, p.stats.wins))} />
        <RankBox title="패배" rows={rankPitchers((p) => p.stats.losses).map((p) => pitcherRow(p, p.stats.losses))} />
        <RankBox title="탈삼진" rows={rankPitchers((p) => p.stats.strikeouts).map((p) => pitcherRow(p, p.stats.strikeouts))} />
        <RankBox title="이닝" rows={rankPitchers((p) => p.stats.outs).map((p) => pitcherRow(p, getInningsText(p.stats.outs)))} />
        <RankBox title="세이브" rows={rankPitchers((p) => p.stats.saves).map((p) => pitcherRow(p, p.stats.saves))} />
        <RankBox title="홀드" rows={rankPitchers((p) => p.stats.holds).map((p) => pitcherRow(p, p.stats.holds))} />
        <RankBox title={`WHIP · 규정 ${inningsRequired}이닝`} rows={qualifiedWhipPitchers.map((p) => pitcherRow(p, formatNum(pitcherWhip(p))))} />
        <RankBox title="QS수" rows={rankPitchers((p) => p.stats.qualityStarts).map((p) => pitcherRow(p, p.stats.qualityStarts))} />
      </div>
    </section>
  );
};

const StadiumView = ({ game, logIndex, setLogIndex }: { game: GameSummary; logIndex: number; setLogIndex: (next: number) => void }) => {
  const current = game.logs[Math.min(logIndex, game.logs.length - 1)];
  const progress = game.logs.length ? Math.round(((logIndex + 1) / game.logs.length) * 100) : 0;
  const isFinished = logIndex >= game.logs.length - 1;

  return (
    <section className="panel stadium-panel">
      <div className="section-title"><h2>경기 보기</h2><span>{game.awayTeamName} {game.awayScore} : {game.homeScore} {game.homeTeamName}</span></div>
      <div className="stadium-layout">
        <div className="stadium">
          <div className="field">
            <div className="field-shape" />
            <div className="grass-stripe s1" /><div className="grass-stripe s2" /><div className="grass-stripe s3" /><div className="grass-stripe s4" /><div className="grass-stripe s5" />
            <div className="outfield-line" />
            <div className="foul-line left-foul" /><div className="foul-line right-foul" />
            <div className="infield-dirt" />
            <div className="base home">H</div><div className="base first">1B</div><div className="base second">2B</div><div className="base third">3B</div>
            {[["P","p"],["C","c"],["1B","fb"],["2B","sb"],["3B","tb"],["SS","ss"],["LF","lf"],["CF","cf"],["RF","rf"]].map(([name, cls]) => <span key={cls} className={`fielder fielder-${cls}`}>{name}</span>)}
            {current && <div className={zoneClass(current.zone)}>⚾</div>}
            {current && <div className="play-message">{current.result}</div>}
          </div>
        </div>
        <div className="play-log-card">
          <p className="eyebrow">현재 플레이</p>
          <h3>{current?.message ?? "경기 로그 없음"}</h3>
          <p className="current-pitcher-line">현재 투수: <b>{current?.pitcherName || "이닝 종료"}</b></p>
          <p>아웃: {current?.outsAfter ?? 0} / 스코어: {current?.awayScore ?? 0} : {current?.homeScore ?? 0}</p>
          <div className="progress"><div style={{ width: `${progress}%` }} /></div>
          <div className="button-row">
            <button onClick={() => setLogIndex(Math.max(0, logIndex - 1))}>이전</button>
            <button className="primary" onClick={() => setLogIndex(Math.min(game.logs.length - 1, logIndex + 1))}>다음 플레이</button>
            <button onClick={() => setLogIndex(Math.max(0, game.logs.length - 1))} disabled={isFinished}>남은 경기 자동 진행</button>
          </div>
          {isFinished && <p className="finished-note">경기가 끝났습니다. 위의 다음 경기 버튼으로 다음 경기를 진행하면 됩니다.</p>}
          <div className="highlight-box"><h4>{game.isDraw ? "무승부 경기 하이라이트 TOP 3" : "승리팀 기준 하이라이트 TOP 3"}</h4>{game.highlights.map((h) => <p key={h.id}>· {h.message}</p>)}</div>
          <div className="highlight-box"><h4>경기 MVP</h4><p>{game.mvpName ? `${game.mvpName}` : "무승부 또는 기록 없음"}</p></div>
        </div>
      </div>
    </section>
  );
};

interface BatterLine { id: string; name: string; position: string; teamName: string; ab: number; r: number; h: number; rbi: number; hr: number; bb: number; k: number; gidp: number; }
interface PitcherLine { id: string; name: string; label: string; teamName: string; outs: number; h: number; r: number; er: number; bb: number; k: number; hr: number; bf: number; ab: number; }

const buildGameBoxScore = (season: SeasonState, game: GameSummary) => {
  const away = season.teams.find((t) => t.id === game.awayTeamId)!;
  const home = season.teams.find((t) => t.id === game.homeTeamId)!;
  const teams = [away, home];
  const batterMap = new Map<string, BatterLine>();
  const pitcherMap = new Map<string, PitcherLine>();
  const innings = Array.from({ length: game.innings }, (_, i) => i + 1);
  const line = {
    away: innings.map(() => 0), home: innings.map(() => 0),
    awayHits: 0, homeHits: 0, awayWalks: 0, homeWalks: 0,
  };

  teams.forEach((team) => {
    team.batters.forEach((b) => batterMap.set(b.id, { id: b.id, name: b.name, position: b.position, teamName: team.shortName, ab: 0, r: 0, h: 0, rbi: 0, hr: 0, bb: 0, k: 0, gidp: 0 }));
    team.pitchers.forEach((p) => pitcherMap.set(p.id, { id: p.id, name: p.name, label: p.label, teamName: team.shortName, outs: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, bf: 0, ab: 0 }));
  });

  game.logs.forEach((log) => {
    if (log.runsScored > 0 && log.inning >= 1 && log.inning <= game.innings) {
      if (log.offenseTeamId === game.awayTeamId) line.away[log.inning - 1] += log.runsScored;
      if (log.offenseTeamId === game.homeTeamId) line.home[log.inning - 1] += log.runsScored;
    }
    if (!log.batterId || !log.pitcherId) return;
    const batter = batterMap.get(log.batterId);
    const pitcher = pitcherMap.get(log.pitcherId);
    if (hitKinds.includes(log.kind)) {
      if (log.offenseTeamId === game.awayTeamId) line.awayHits += 1; else line.homeHits += 1;
    }
    if (log.kind === "WALK") {
      if (log.offenseTeamId === game.awayTeamId) line.awayWalks += 1; else line.homeWalks += 1;
    }
    if (batter) {
      if (atBatKinds.includes(log.kind)) batter.ab += 1;
      if (hitKinds.includes(log.kind)) batter.h += 1;
      if (log.kind === "HOMER") batter.hr += 1;
      if (log.kind === "WALK") batter.bb += 1;
      if (log.kind === "STRIKEOUT") batter.k += 1;
      if (log.kind === "DOUBLE_PLAY") batter.gidp += 1;
      batter.rbi += log.rbi;
      (log.scoredRunnerIds ?? []).forEach((runnerId) => { if (runnerId === batter.id) batter.r += 1; });
    }
    if (pitcher) {
      pitcher.bf += 1;
      if (atBatKinds.includes(log.kind)) pitcher.ab += 1;
      pitcher.outs += Math.max(0, log.outsAfter - log.outsBefore);
      if (hitKinds.includes(log.kind)) pitcher.h += 1;
      if (log.kind === "WALK") pitcher.bb += 1;
      if (log.kind === "STRIKEOUT") pitcher.k += 1;
      if (log.kind === "HOMER") pitcher.hr += 1;
      pitcher.r += log.runsScored;
      pitcher.er += log.runsScored;
    }
  });

  const homeHalfPlayed = (inning: number) => game.logs.some((l) => l.inning === inning && l.half === "말" && l.batterId);
  return {
    away, home, innings, line, homeHalfPlayed,
    awayBatters: away.batters.map((b) => batterMap.get(b.id)!).filter(Boolean),
    homeBatters: home.batters.map((b) => batterMap.get(b.id)!).filter(Boolean),
    awayPitchers: away.pitchers.map((p) => pitcherMap.get(p.id)!).filter((p) => p.bf > 0),
    homePitchers: home.pitchers.map((p) => pitcherMap.get(p.id)!).filter((p) => p.bf > 0),
  };
};

const LineScoreTable = ({ data, game }: { data: ReturnType<typeof buildGameBoxScore>; game: GameSummary }) => (
  <div className="line-score table-scroll">
    <table>
      <thead><tr><th>팀</th>{data.innings.map((i) => <th key={i}>{i}</th>)}<th>R</th><th>H</th><th>BB</th></tr></thead>
      <tbody>
        <tr><td className="team-name-cell"><TeamTag team={data.away} /></td>{data.line.away.map((r, i) => <td key={i}>{r}</td>)}<td>{game.awayScore}</td><td>{data.line.awayHits}</td><td>{data.line.awayWalks}</td></tr>
        <tr><td className="team-name-cell"><TeamTag team={data.home} /></td>{data.line.home.map((r, i) => <td key={i}>{!data.homeHalfPlayed(i + 1) && i + 1 >= 9 && game.homeScore > game.awayScore ? "X" : r}</td>)}<td>{game.homeScore}</td><td>{data.line.homeHits}</td><td>{data.line.homeWalks}</td></tr>
      </tbody>
    </table>
  </div>
);

const BatterBoxTable = ({ title, rows, onPlayerClick }: { title: string; rows: BatterLine[]; onPlayerClick: (id: string) => void }) => {
  const total = rows.reduce((acc, r) => ({ ab: acc.ab + r.ab, r: acc.r + r.r, h: acc.h + r.h, rbi: acc.rbi + r.rbi, hr: acc.hr + r.hr, bb: acc.bb + r.bb, k: acc.k + r.k, gidp: acc.gidp + r.gidp }), { ab: 0, r: 0, h: 0, rbi: 0, hr: 0, bb: 0, k: 0, gidp: 0 });
  return (
    <div className="boxscore-table"><h3>{title} 타자 기록</h3><div className="table-scroll"><table><thead><tr><th>타자명</th><th>타수</th><th>득점</th><th>안타</th><th>타점</th><th>홈런</th><th>볼넷</th><th>삼진</th><th>병살</th><th>타율</th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.id}><td className="team-name-cell"><PlayerLink playerId={r.id} onPlayerClick={onPlayerClick}>{r.name}</PlayerLink> <small>{r.position}</small></td><td>{r.ab}</td><td>{r.r}</td><td>{r.h}</td><td>{r.rbi}</td><td>{r.hr}</td><td>{r.bb}</td><td>{r.k}</td><td>{r.gidp}</td><td>{r.ab ? formatRate(r.h / r.ab) : "0.000"}</td></tr>)}
      <tr className="total-row"><td>합계</td><td>{total.ab}</td><td>{total.r}</td><td>{total.h}</td><td>{total.rbi}</td><td>{total.hr}</td><td>{total.bb}</td><td>{total.k}</td><td>{total.gidp}</td><td>{total.ab ? formatRate(total.h / total.ab) : "0.000"}</td></tr>
    </tbody></table></div></div>
  );
};

const PitcherBoxTable = ({ title, rows, onPlayerClick }: { title: string; rows: PitcherLine[]; onPlayerClick: (id: string) => void }) => {
  const total = rows.reduce((acc, r) => ({ outs: acc.outs + r.outs, h: acc.h + r.h, r: acc.r + r.r, er: acc.er + r.er, bb: acc.bb + r.bb, k: acc.k + r.k, hr: acc.hr + r.hr, bf: acc.bf + r.bf, ab: acc.ab + r.ab }), { outs: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, bf: 0, ab: 0 });
  return (
    <div className="boxscore-table"><h3>{title} 투수 기록</h3><div className="table-scroll"><table><thead><tr><th>투수명</th><th>이닝</th><th>피안타</th><th>실점</th><th>자책</th><th>4사구</th><th>삼진</th><th>피홈런</th><th>타자</th><th>타수</th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.id}><td className="team-name-cell"><PlayerLink playerId={r.id} onPlayerClick={onPlayerClick}>{r.name}</PlayerLink> <small>{r.label}</small></td><td>{getInningsText(r.outs)}</td><td>{r.h}</td><td>{r.r}</td><td>{r.er}</td><td>{r.bb}</td><td>{r.k}</td><td>{r.hr}</td><td>{r.bf}</td><td>{r.ab}</td></tr>)}
      <tr className="total-row"><td>합계</td><td>{getInningsText(total.outs)}</td><td>{total.h}</td><td>{total.r}</td><td>{total.er}</td><td>{total.bb}</td><td>{total.k}</td><td>{total.hr}</td><td>{total.bf}</td><td>{total.ab}</td></tr>
    </tbody></table></div></div>
  );
};

const GameBoxScore = ({ season, game, onPlayerClick }: { season: SeasonState; game: GameSummary; onPlayerClick: (id: string) => void }) => {
  const data = buildGameBoxScore(season, game);
  return (
    <section className="panel boxscore-panel">
      <div className="section-title"><h2>경기 기록지</h2><span>이닝별 득점 · 팀 H/BB · 선수별 기록</span></div>
      <p className="result-line small-result">{game.awayTeamName} {game.awayScore} : {game.homeScore} {game.homeTeamName}</p>
      <LineScoreTable data={data} game={game} />
      <div className="boxscore-grid">
        <BatterBoxTable title={data.away.shortName} rows={data.awayBatters} onPlayerClick={onPlayerClick} />
        <PitcherBoxTable title={data.away.shortName} rows={data.awayPitchers} onPlayerClick={onPlayerClick} />
        <BatterBoxTable title={data.home.shortName} rows={data.homeBatters} onPlayerClick={onPlayerClick} />
        <PitcherBoxTable title={data.home.shortName} rows={data.homePitchers} onPlayerClick={onPlayerClick} />
      </div>
    </section>
  );
};

const PlayerDetailModal = ({ lookup, onClose }: { lookup: PlayerLookup | null; onClose: () => void }) => {
  if (!lookup) return null;
  const { team, player } = lookup;
  const isBatter = lookup.kind === "batter";
  const p = player as any;
  const title = isBatter ? `${team.shortName} ${p.name} · ${p.lineupNo}번 ${p.position}` : `${team.shortName} ${p.name} · ${p.label}`;
  const batterStats = isBatter ? [
    ["타율", formatRate(getBattingAverage(p))], ["경기수", p.stats.games], ["타석", p.stats.plateAppearances], ["타수", p.stats.atBats], ["득점", p.stats.runs], ["안타", p.stats.hits], ["2루타", p.stats.doubles], ["3루타", p.stats.triples], ["홈런", p.stats.homeRuns], ["타점", p.stats.rbi], ["희생플라이", p.stats.sacFlies], ["볼넷", p.stats.walks], ["삼진", p.stats.strikeouts], ["병살타", p.stats.gidp], ["출루율", formatRate(getOnBasePercentage(p))], ["장타율", formatRate(getSlugging(p))], ["OPS", formatRate(getOps(p))], ["득점권타율", formatRate(safeDiv(p.stats.rispHits, p.stats.rispAtBats))], ["볼삼비", formatNum(safeDiv(p.stats.walks, p.stats.strikeouts))], ["RC27", formatNum(rc27(p))], ["순출루율", formatRate(getOnBasePercentage(p) - getBattingAverage(p))], ["순장타율", formatRate(getSlugging(p) - getBattingAverage(p))], ["경기 MVP", p.stats.gameMvp], ["하이라이트", p.stats.highlights], ["기여도", round1(p.stats.contribution)]
  ] : [];
  const pitcherStats = !isBatter ? [
    ["ERA", formatEra(getEra(p))], ["경기수", p.stats.games], ["승", p.stats.wins], ["패", p.stats.losses], ["세이브", p.stats.saves], ["홀드", p.stats.holds], ["승률", formatWinRate(p.stats.wins, p.stats.losses)], ["이닝", getInningsText(p.stats.outs)], ["피안타", p.stats.hitsAllowed], ["피홈런", p.stats.homeRunsAllowed], ["볼넷", p.stats.walks], ["삼진", p.stats.strikeouts], ["WHIP", formatNum(pitcherWhip(p))], ["평균이닝", formatAverageInningsText(p)], ["QS수", p.stats.qualityStarts ?? 0], ["피안타율", formatRate(pitcherAvgAllowed(p))], ["K/BB", formatNum(pitcherKbb(p))], ["경기 MVP", p.stats.gameMvp], ["하이라이트", p.stats.highlights], ["기여도", round1(p.stats.contribution)]
  ] : [];
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal player-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="section-title modal-title"><h2>{title}</h2><span>{team.name}</span></div>
        <div className="detail-grid">
          {(isBatter ? batterStats : pitcherStats).map(([label, value]) => <div className="detail-card" key={label}><span>{label}</span><b>{value}</b></div>)}
        </div>
      </div>
    </div>, document.body
  );
};

const HelpModal = ({ onClose }: { onClose: () => void }) => createPortal(
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>×</button>
      <div className="section-title modal-title"><h2>기능 설명</h2><span>어떤 기능이 어디에 있는지 안내</span></div>
      <div className="help-grid">
        <div><h3>다음 경기</h3><p>한 경기 보기, 한 경기 빠른 진행, 10경기 빠른 진행을 실행합니다.</p></div>
        <div><h3>OOP 필수 기능</h3><p>PlayerADT → BaseballPlayer → Batter/Pitcher 상속 구조를 클릭하고 다형성 결과를 확인합니다.</p></div>
        <div><h3>경기 보기</h3><p>플레이 로그를 하나씩 보며 야구장 위 공 위치와 수비 위치를 확인합니다.</p></div>
        <div><h3>경기 기록지</h3><p>최근 경기의 이닝별 득점, 팀 H/BB, 타자/투수 기록을 봅니다.</p></div>
        <div><h3>팀 기록실</h3><p>리그 전체 팀 순위와 팀별 기록을 확인합니다.</p></div>
        <div><h3>선수 기록실</h3><p>부문별 TOP 50을 확인하고 선수 이름을 눌러 세부 기록을 봅니다.</p></div>
        <div><h3>시상식</h3><p>시즌 종료 후 MVP와 포지션별 골든글러브 순위를 확인합니다.</p></div>
      </div>
    </div>
  </div>, document.body
);

const StatHelpModal = ({ onClose }: { onClose: () => void }) => createPortal(
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>×</button>
      <div className="section-title modal-title"><h2>기록 설명</h2><span>자주 나오는 야구 기록 약어</span></div>
      <div className="help-grid record-help-grid">
        <div><b>AVG/타율</b><p>안타 ÷ 타수</p></div><div><b>OBP/출루율</b><p>(안타+볼넷) ÷ (타수+볼넷+희생플라이)</p></div><div><b>SLG/장타율</b><p>총루타 ÷ 타수</p></div><div><b>OPS</b><p>출루율 + 장타율</p></div>
        <div><b>ERA</b><p>9이닝 기준 자책점</p></div><div><b>WHIP</b><p>(피안타+볼넷) ÷ 이닝</p></div><div><b>QS</b><p>선발 6이닝 이상 3자책 이하</p></div><div><b>K/BB</b><p>삼진 ÷ 볼넷</p></div>
        <div><b>RC27</b><p>한 선수가 27아웃을 모두 쓴다고 가정한 득점 생산력</p></div><div><b>순출루율</b><p>출루율 - 타율</p></div><div><b>순장타율</b><p>장타율 - 타율</p></div><div><b>게임차</b><p>1위와의 승패 차이를 반영한 순위 거리</p></div><div><b>기여도</b><p>타격, 투구, 하이라이트, MVP, QS, 세이브, 홀드 등을 합산한 앱 내부 선수 평가 점수입니다.</p></div>
      </div>
    </div>
  </div>, document.body
);

const TeamInfo = ({ season, selectedTeam, onPlayerClick }: { season: SeasonState; selectedTeam: TeamState; onPlayerClick: (id: string) => void }) => {
  const [open, setOpen] = useState(false);
  const opponents = season.teams.filter((t) => t.id !== selectedTeam.id);
  return <>
    <button onClick={() => setOpen(true)}>팀 정보</button>
    {open && createPortal(<div className="modal-backdrop" onClick={() => setOpen(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setOpen(false)}>×</button><div className="section-title modal-title"><h2>{selectedTeam.name} 정보</h2><span>{selectedTeam.region} · {selectedTeam.stadium}</span></div>
      <h3>상대팀별 전적</h3><div className="table-scroll"><table><thead><tr><th>상대</th><th>승</th><th>무</th><th>패</th><th>득점</th><th>실점</th><th>홈승</th><th>원정승</th></tr></thead><tbody>{opponents.map((op) => { const r = selectedTeam.record.headToHead[op.id]; return <tr key={op.id}><td><TeamTag team={op} /></td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.runsFor}</td><td>{r.runsAgainst}</td><td>{r.homeWins}</td><td>{r.awayWins}</td></tr>; })}</tbody></table></div>
      <h3>우리 팀 타자 기록</h3><div className="table-scroll"><table><thead><tr><th>선수</th><th>AVG</th><th>H</th><th>2B</th><th>3B</th><th>HR</th><th>RBI</th><th>R</th><th>BB</th><th>OBP</th><th>SLG</th><th>OPS</th></tr></thead><tbody>{selectedTeam.batters.map((b) => <tr key={b.id}><td><PlayerLink playerId={b.id} onPlayerClick={onPlayerClick}>{b.name}</PlayerLink></td><td>{formatRate(getBattingAverage(b))}</td><td>{b.stats.hits}</td><td>{b.stats.doubles}</td><td>{b.stats.triples}</td><td>{b.stats.homeRuns}</td><td>{b.stats.rbi}</td><td>{b.stats.runs}</td><td>{b.stats.walks}</td><td>{formatRate(getOnBasePercentage(b))}</td><td>{formatRate(getSlugging(b))}</td><td>{formatRate(getOps(b))}</td></tr>)}</tbody></table></div>
      <h3>우리 팀 투수 기록</h3><div className="table-scroll"><table><thead><tr><th>선수</th><th>역할</th><th>G</th><th>ERA</th><th>승</th><th>패</th><th>K</th><th>이닝</th><th>SV</th><th>HLD</th></tr></thead><tbody>{selectedTeam.pitchers.map((p) => <tr key={p.id}><td><PlayerLink playerId={p.id} onPlayerClick={onPlayerClick}>{p.name}</PlayerLink></td><td>{p.label}</td><td>{p.stats.games}</td><td>{formatEra(getEra(p))}</td><td>{p.stats.wins}</td><td>{p.stats.losses}</td><td>{p.stats.strikeouts}</td><td>{getInningsText(p.stats.outs)}</td><td>{p.stats.saves}</td><td>{p.stats.holds}</td></tr>)}</tbody></table></div>
    </div></div>, document.body)}
  </>;
};

const RecordMenu = ({ activePanel, setActivePanel, hasGame, seasonFinished }: { activePanel: ActivePanel; setActivePanel: (panel: ActivePanel) => void; hasGame: boolean; seasonFinished: boolean }) => {
  const openBoxScore = () => { if (!hasGame) { alert("아직 진행된 경기가 없습니다. 먼저 한 경기 보기 또는 빠른 진행을 실행해주세요."); return; } setActivePanel("boxscore"); };
  const openAwards = () => { if (!seasonFinished) { alert("아직 시즌이 끝나지 않았습니다. 144경기를 모두 진행한 뒤 시상식을 확인할 수 있습니다."); return; } setActivePanel("awards"); };
  return <section className="panel record-menu-panel"><div className="section-title"><h2>기록 메뉴</h2><span>필요한 기록 화면을 버튼으로 열기</span></div><div className="record-menu-grid"><button className={`menu-button ${activePanel === "boxscore" ? "is-active" : ""}`} onClick={openBoxScore}>경기 기록지</button><button className={`menu-button ${activePanel === "team" ? "is-active" : ""}`} onClick={() => setActivePanel("team")}>팀 기록실</button><button className={`menu-button ${activePanel === "players" ? "is-active" : ""}`} onClick={() => setActivePanel("players")}>선수 기록실</button><button className={`menu-button ${activePanel === "awards" ? "is-active" : ""}`} onClick={openAwards}>시상식</button></div><p className="muted menu-note">시즌 중에는 경기 기록지, 팀 기록실, 선수 기록실을 확인할 수 있고, 시상식은 시즌 종료 후 열립니다.</p></section>;
};

const batterAwardScore = (b: BatterData) => {
  const singles = b.stats.hits - b.stats.doubles - b.stats.triples - b.stats.homeRuns;
  const outs = batterOuts(b);
  return b.stats.plateAppearances * 0.12 + b.stats.runs * 1.5 - outs * 0.25 + singles * 1.8 + b.stats.doubles * 3.5 + b.stats.triples * 5.2 + b.stats.homeRuns * 8.5 + b.stats.rbi * 3 + b.stats.walks * 1.8 + b.stats.sacFlies * 1.2 - b.stats.strikeouts * 0.8 - b.stats.gidp * 4 + b.stats.gameMvp * 3 + b.stats.highlights * 1.2;
};
const pitcherAwardScore = (p: PitcherData) => {
  const ip = inningsNumber(p.stats.outs);
  const era = getEra(p);
  const whip = pitcherWhip(p);
  const kbb = pitcherKbb(p);
  const avgIp = pitcherAvgInnings(p);
  const qs = p.stats.qualityStarts ?? 0;
  const runPreventionBonus = Math.max(0, 4.8 - era) * 18 + Math.max(0, 1.45 - whip) * 38;
  const commandBonus = Math.max(0, kbb - 1.4) * 5;
  const roleScore = p.role === "SP"
    ? qs * 15 + avgIp * 16 + p.stats.wins * 8 + 24
    : p.stats.saves * 10 + p.stats.holds * 5 + Math.min(ip, 90) * 0.7;
  return ip * 2.15 + p.stats.strikeouts * 1.05 + roleScore + runPreventionBonus + commandBonus
    - p.stats.earnedRuns * 2.4 - p.stats.hitsAllowed * 0.45 - p.stats.walks * 0.7
    - p.stats.losses * 6 - p.stats.blownSaves * 9 + p.stats.gameMvp * 4 + p.stats.highlights * 1.5;
};

const SeasonAwards = ({ season, onPlayerClick }: { season: SeasonState; onPlayerClick: (id: string) => void }) => {
  const players = [
    ...season.teams.flatMap((t) => t.batters.map((p) => ({ id: p.id, name: p.name, position: p.position, team: t.shortName, teamId: t.id, score: batterAwardScore(p) }))),
    ...season.teams.flatMap((t) => t.pitchers.map((p) => ({ id: p.id, name: p.name, position: "P", team: t.shortName, teamId: t.id, score: pitcherAwardScore(p) }))),
  ].sort((a, b) => b.score - a.score);
  const positions = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "P"];
  const positionRankings = positions.map((pos) => ({ position: pos, rows: players.filter((p) => p.position === pos).sort((a, b) => b.score - a.score).slice(0, 10) }));
  const golden = positionRankings.map((group) => group.rows[0]).filter(Boolean);
  const mvpTop15 = players.slice(0, 15);
  const teamMap = new Map(season.teams.map((team) => [team.id, team]));
  const awardName = (p: { id: string; team: string; teamId: string; name: string }) => <><TeamTag team={teamMap.get(p.teamId)} shortName={p.team} /> <PlayerLink playerId={p.id} onPlayerClick={onPlayerClick}>{p.name}</PlayerLink></>;
  return <section className="panel"><div className="section-title"><h2>시즌 종료 시상식</h2><span>시즌 MVP · 골든글러브 · 포지션별 점수 순위</span></div><h3>시즌 MVP</h3><p>{players[0] ? <>{awardName(players[0])} ({players[0].score.toFixed(1)}점)</> : "아직 없음"}</p><h3>골든글러브 수상자</h3><div className="award-grid">{golden.map((p) => <div className="award-card" key={p.id}><b>{p.position}</b><span>{awardName(p)}</span><small>{p.score.toFixed(1)}점</small></div>)}</div><div className="award-lists"><div className="award-list wide-award-list"><h3>골든글러브 포지션별 TOP 10</h3><div className="position-award-grid">{positionRankings.map((group) => <div className="position-award-box" key={group.position}><h4>{group.position}</h4><ol>{group.rows.map((p, i) => <li key={p.id}>{i + 1}위 {awardName(p)} · {p.score.toFixed(1)}점</li>)}</ol></div>)}</div></div><div className="award-list"><h3>시즌 MVP 점수 TOP 15</h3><ol>{mvpTop15.map((p, i) => <li key={p.id}>{i + 1}위 {awardName(p)} · {p.score.toFixed(1)}점</li>)}</ol></div></div></section>;
};

const clampRating = (value: number) => Math.max(35, Math.min(99, Math.round(value)));
const applySelectedTeamBoost = (season: SeasonState, teamId: string): SeasonState => ({ ...season, teams: season.teams.map((team) => team.id !== teamId ? team : { ...team, batters: team.batters.map((batter) => ({ ...batter, contact: clampRating(batter.contact + 4), power: clampRating(batter.power + 4), discipline: clampRating(batter.discipline + 4), speed: clampRating(batter.speed + 4), clutch: clampRating(batter.clutch + 4) })), pitchers: team.pitchers.map((pitcher) => ({ ...pitcher, stuff: clampRating(pitcher.stuff + 4), control: clampRating(pitcher.control + 4), stamina: clampRating(pitcher.stamina + 4), crisis: clampRating(pitcher.crisis + 4) })) }) });

function App() {
  const [season, setSeason] = useState<SeasonState>(() => loadSeason() ?? createNewSeason());
  const [viewGame, setViewGame] = useState<GameSummary | null>(null);
  const [logIndex, setLogIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<ActivePanel>("team");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showStatHelp, setShowStatHelp] = useState(false);
  const [showStartNotice, setShowStartNotice] = useState(false);

  useEffect(() => { saveSeason(season); }, [season]);
  useEffect(() => { if (!showStartNotice) return; const timer = window.setTimeout(() => setShowStartNotice(false), 3600); return () => window.clearTimeout(timer); }, [showStartNotice]);
  const selectedTeam = useMemo(() => season.teams.find((t) => t.id === season.selectedTeamId) ?? null, [season]);
  const selectedPlayerLookup = useMemo(() => findPlayer(season, selectedPlayerId), [season, selectedPlayerId]);
  const currentRoundGames = season.schedule[season.currentRound] ?? [];
  const nextGame = selectedTeam ? currentRoundGames.find((g) => g.awayTeamId === selectedTeam.id || g.homeTeamId === selectedTeam.id) : null;
  const opponent = nextGame && selectedTeam ? season.teams.find((t) => t.id === (nextGame.awayTeamId === selectedTeam.id ? nextGame.homeTeamId : nextGame.awayTeamId)) : null;
  const currentLog = viewGame?.logs[Math.min(logIndex, Math.max(0, viewGame.logs.length - 1))];

  const commitSeason = (nextSeason: SeasonState) => {
    const saved = saveSeason(nextSeason);
    setSeason(saved);
    return saved;
  };

  const selectTeam = (teamId: string, mode: Exclude<SimulationMode, null>) => {
    const withSelection: SeasonState = { ...season, selectedTeamId: teamId, simulationMode: mode, userBoostedTeamId: mode === "USER_BOOST" ? teamId : null };
    const next = mode === "USER_BOOST" ? applySelectedTeamBoost(withSelection, teamId) : withSelection;
    commitSeason(next);
    setShowStartNotice(true);
  };

  const runRound = (mode: "quick" | "view") => {
    setShowStartNotice(false);
    try {
      const result = playCurrentRound(season);
      commitSeason(result.season);
      setViewGame(result.selectedGame);
      setLogIndex(mode === "view" ? 0 : Math.max(0, (result.selectedGame?.logs.length ?? 1) - 1));
      setActivePanel("boxscore");
    } catch (error) {
      console.error("경기 진행 오류", error);
      alert("경기 진행 중 오류가 발생했습니다. 저장된 시즌을 새 시즌으로 초기화한 뒤 다시 시도해주세요.");
    }
  };

  const runManyRounds = (count: number) => {
    setShowStartNotice(false);
    try {
      let cursor = season;
      let lastSelectedGame: GameSummary | null = null;
      for (let i = 0; i < count; i += 1) {
        if (cursor.seasonFinished) break;
        const result = playCurrentRound(cursor);
        cursor = result.season;
        if (result.selectedGame) lastSelectedGame = result.selectedGame;
      }
      commitSeason(cursor);
      setViewGame(lastSelectedGame);
      setLogIndex(Math.max(0, (lastSelectedGame?.logs.length ?? 1) - 1));
      setActivePanel("boxscore");
    } catch (error) {
      console.error("10경기 진행 오류", error);
      alert("10경기 진행 중 오류가 발생했습니다. 저장된 시즌을 새 시즌으로 초기화한 뒤 다시 시도해주세요.");
    }
  };
  const reset = () => { if (!confirm("저장된 시즌을 지우고 새로 시작할까요?")) return; clearSeason(); setViewGame(null); setLogIndex(0); setActivePanel("team"); setSelectedPlayerId(null); setSeason(createNewSeason()); };

  if (!season.selectedTeamId || !selectedTeam) return <TeamSelect season={season} onSelect={selectTeam} />;

  const appStyle = teamThemeVars(selectedTeam);
  return (
    <main className="app" style={appStyle}>
      <header className="topbar team-themed">
        <div><p className="eyebrow">Baseball OOP Season Simulator</p><h1>{selectedTeam.name} 시즌 대시보드</h1></div>
        <div className="top-actions"><TeamInfo season={season} selectedTeam={selectedTeam} onPlayerClick={setSelectedPlayerId} /><button onClick={() => setShowHelp(true)}>설명</button><button onClick={() => setShowStatHelp(true)}>기록 설명</button><button onClick={() => setSeason(saveSeason(season))}>수동 저장</button><button className="danger" onClick={reset}>새 시즌</button></div>
      </header>

      <section className="dashboard">
        <section className="panel next-game">
          <div className="section-title"><h2>다음 경기</h2><span>{Math.min(season.currentRound + 1, season.schedule.length)} / {season.schedule.length} 경기</span></div>
          {season.seasonFinished ? <p>정규시즌이 종료되었습니다.</p> : <><h3>{nextGame?.awayTeamId === selectedTeam.id ? selectedTeam.shortName : opponent?.shortName} vs {nextGame?.homeTeamId === selectedTeam.id ? selectedTeam.shortName : opponent?.shortName}</h3><p>{opponent?.name} 상대 · {nextGame?.homeTeamId === selectedTeam.id ? "홈" : "원정"} 경기</p><div className="button-row"><button className="primary" onClick={() => runRound("view")}>한 경기 보기</button><button onClick={() => runRound("quick")}>한 경기 빠른 진행</button><button onClick={() => runManyRounds(10)}>10경기 빠른 진행</button></div><p className="muted">내 팀 경기를 진행하면 같은 라운드의 다른 4경기는 자동 빠른 진행됩니다.</p></>}
          <p className="save-text">시즌 모드: {season.simulationMode === "USER_BOOST" ? "사용자 팀 능력 소폭 상승" : "2026 KBO 리그 반영"}</p><p className="save-text">자동 저장: {season.lastSavedAt ? new Date(season.lastSavedAt).toLocaleString() : "아직 없음"}</p>
        </section>
        <OOPDiagram currentLog={currentLog} />
      </section>

      {viewGame ? <StadiumView game={viewGame} logIndex={logIndex} setLogIndex={setLogIndex} /> : <section className="panel stadium-panel empty-stadium"><div className="section-title"><h2>경기 보기</h2><span>한 경기 보기를 누르면 야구장 화면이 표시됩니다.</span></div><p className="muted">플레이 로그와 공 위치 애니메이션이 이 영역에 나타납니다.</p></section>}
      <RecordMenu activePanel={activePanel} setActivePanel={setActivePanel} hasGame={Boolean(viewGame)} seasonFinished={season.seasonFinished} />

      {activePanel === "boxscore" && viewGame && <><section className="panel"><div className="section-title"><h2>최근 경기 결과</h2><span>{viewGame.innings}이닝</span></div><p className="result-line">{viewGame.awayTeamName} {viewGame.awayScore} : {viewGame.homeScore} {viewGame.homeTeamName}</p><p>MVP: {viewGame.mvpName ?? "없음"}</p></section><GameBoxScore season={season} game={viewGame} onPlayerClick={setSelectedPlayerId} /></>}
      {activePanel === "boxscore" && !viewGame && <section className="panel"><div className="section-title"><h2>경기 기록지</h2><span>아직 기록 없음</span></div><p className="muted">한 경기 보기 또는 빠른 진행을 먼저 실행하면 기록지가 표시됩니다.</p></section>}
      {activePanel === "team" && <StandingsTable season={season} />}
      {activePanel === "players" && <PlayerRankings season={season} onPlayerClick={setSelectedPlayerId} />}
      {activePanel === "awards" && season.seasonFinished && <SeasonAwards season={season} onPlayerClick={setSelectedPlayerId} />}

      {selectedPlayerLookup && <PlayerDetailModal lookup={selectedPlayerLookup} onClose={() => setSelectedPlayerId(null)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showStatHelp && <StatHelpModal onClose={() => setShowStatHelp(false)} />}
      {showStartNotice && <div className="floating-notice"><button className="toast-close" onClick={() => setShowStartNotice(false)}>×</button><b>시즌이 시작되었습니다.</b><span>다른 팀을 선택하려면 새 시즌으로 초기화하여야 합니다.</span></div>}
    </main>
  );
}

export default App;
