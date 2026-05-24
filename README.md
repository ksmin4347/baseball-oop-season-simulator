# Baseball OOP Season Simulator

2026년 1학기 자료구조 과제 2  
OOP 설계 기반 인터랙티브 웹앱 구현 및 풀사이클 배포 프로젝트입니다.

## 프로젝트 개요

본 프로젝트는 이전 과제 1인 Python 기반으로 설계한 야구 선수 OOP 구조를 React/TypeScript 웹앱으로 확장한 결과물입니다.

과제 1에서 설계한 PlayerADT, BaseballPlayer, Batter, Pitcher 구조를 바탕으로 웹 화면에서 상속 구조를 시각화하고, 각 클래스 노드를 클릭했을 때 오버라이딩된 play() 메서드의 결과가 다르게 출력되도록 구현했습니다.

## 핵심 OOP 구조

PlayerADT  
→ BaseballPlayer  
→ Batter / Pitcher

- PlayerADT: 모든 선수 객체가 가져야 할 공통 인터페이스 정의
- BaseballPlayer: 이름, 포지션, 팀명 등 공통 속성 관리
- Batter: play() 메서드를 오버라이딩하여 타격 결과 생성
- Pitcher: play() 메서드를 오버라이딩하여 투구 결과 생성

## 주요 기능

- 10개 팀 선택
- 2026 KBO 리그 반영 시뮬레이션 모드
- 사용자 팀 능력 소폭 상승 모드
- 한 경기 보기
- 한 경기 빠른 진행
- 10경기 빠른 진행
- 144경기 시즌 진행
- 팀 순위표
- 선수 기록실
- 경기 기록지
- 팀 정보
- 시즌 시상식
- OOP 상속 구조 시각화
- 다형성 인터랙션
- 브라우저 저장 기능

## 실행 방법

```bash
npm install
npm run dev