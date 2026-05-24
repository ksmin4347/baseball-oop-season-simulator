import type { BatterData, PitcherData, PlayLog } from "./types";

export interface PlayerADT {
  readonly name: string;
  readonly position: string;
  play(): string;
  showInfo(): string;
}

export abstract class BaseballPlayer implements PlayerADT {
  constructor(
    public readonly name: string,
    public readonly position: string,
    public readonly teamName: string,
  ) {}

  play(): string {
    return `${this.name} 플레이`;
  }

  showInfo(): string {
    return `${this.teamName} ${this.name} ${this.position}`;
  }
}

export class Batter extends BaseballPlayer {
  constructor(private readonly data: BatterData, teamName: string) {
    super(data.name, data.position, teamName);
  }

  play(): string {
    return `${this.name} 타격`;
  }

  showInfo(): string {
    const s = this.data.stats;
    const avg = s.atBats === 0 ? "0.000" : (s.hits / s.atBats).toFixed(3);
    return `[타자] ${this.teamName} ${this.name} ${this.position} 타율:${avg} 홈런:${s.homeRuns} 타점:${s.rbi}`;
  }
}

export class Pitcher extends BaseballPlayer {
  constructor(private readonly data: PitcherData, teamName: string) {
    super(data.name, "투수", teamName);
  }

  play(): string {
    return `${this.name} 투구`;
  }

  showInfo(): string {
    const s = this.data.stats;
    const innings = s.outs / 3;
    const era = innings === 0 ? "0.00" : ((s.earnedRuns * 9) / innings).toFixed(2);
    return `[투수] ${this.teamName} ${this.name} ERA:${era} 탈삼진:${s.strikeouts}`;
  }
}

export const makePolymorphismText = (log?: PlayLog) => {
  if (!log) {
    return {
      currentObject: "아직 없음",
      parentClass: "BaseballPlayer",
      actualClass: "Batter / Pitcher",
      methodCalled: "play()",
      result: "선수 카드를 클릭하거나 경기를 진행하면 결과가 표시됩니다.",
      description: "PlayerADT → BaseballPlayer → Batter/Pitcher 구조를 화면에서 확인할 수 있습니다.",
    };
  }

  return {
    currentObject: log.batterName,
    parentClass: log.parentClass,
    actualClass: log.actualClass,
    methodCalled: log.methodCalled,
    result: log.result,
    description: log.oopMessage,
  };
};