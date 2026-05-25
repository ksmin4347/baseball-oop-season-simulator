import type { BatterData, BatterRatings, PitcherData, PitcherRatings, TeamState } from "./types";

type RawBatter = {
  lineupNo: number;
  position: string;
  name: string;
  contact?: number;
  power?: number;
  discipline?: number;
  speed?: number;
  clutch?: number;
};

type RawPitcher = {
  name: string;
  role: "SP" | "RP" | "CP";
  label: string;
  rotationNo: number | null;
  bullpenTier: "SETUP" | "MOPUP" | "LONG" | "CLOSER" | null;
  stuff?: number;
  control?: number;
  stamina?: number;
  crisis?: number;
};

const rawTeams: {
  meta: {
    id: string;
    name: string;
    shortName: string;
    primaryColor: string;
    secondaryColor: string;
    region: string;
    stadium: string;
  };
  batters: RawBatter[];
  pitchers: RawPitcher[];
}[] = [
  {
    "meta": {
      "id": "samsung",
      "name": "삼성라이온즈",
      "shortName": "삼성",
      "primaryColor": "#1d4ed8",
      "secondaryColor": "#ffffff",
      "region": "대구",
      "stadium": "대구 삼성라이온즈파크"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "CF",
        "name": "김지찬",
        "contact": 79,
        "power": 50,
        "discipline": 85,
        "speed": 100,
        "clutch": 70
      },
      {
        "lineupNo": 2,
        "position": "RF",
        "name": "김성윤",
        "contact": 90,
        "power": 70,
        "discipline": 80,
        "speed": 98,
        "clutch": 75
      },
      {
        "lineupNo": 3,
        "position": "LF",
        "name": "구자욱",
        "contact": 92,
        "power": 83,
        "discipline": 78,
        "speed": 85,
        "clutch": 78
      },
      {
        "lineupNo": 4,
        "position": "1B",
        "name": "디아즈",
        "contact": 83,
        "power": 100,
        "discipline": 80,
        "speed": 35,
        "clutch": 85
      },
      {
        "lineupNo": 5,
        "position": "DH",
        "name": "최형우",
        "contact": 93,
        "power": 85,
        "discipline": 88,
        "speed": 38,
        "clutch": 90
      },
      {
        "lineupNo": 6,
        "position": "3B",
        "name": "김영웅",
        "contact": 70,
        "power": 94,
        "discipline": 50,
        "speed": 72,
        "clutch": 70
      },
      {
        "lineupNo": 7,
        "position": "2B",
        "name": "류지혁",
        "contact": 81,
        "power": 65,
        "discipline": 75,
        "speed": 83,
        "clutch": 75
      },
      {
        "lineupNo": 8,
        "position": "C",
        "name": "강민호",
        "contact": 65,
        "power": 73,
        "discipline": 53,
        "speed": 35,
        "clutch": 60
      },
      {
        "lineupNo": 9,
        "position": "SS",
        "name": "이재현",
        "contact": 73,
        "power": 76,
        "discipline": 73,
        "speed": 70,
        "clutch": 80
      }
    ],
    "pitchers": [
      {
        "name": "후라도",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발",
        "stuff": 90,
        "control": 95,
        "stamina": 98,
        "crisis": 85
      },
      {
        "name": "원태인",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발",
        "stuff": 91,
        "control": 94,
        "stamina": 89,
        "crisis": 80
      },
      {
        "name": "오러클린",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발",
        "stuff": 80,
        "control": 72,
        "stamina": 82,
        "crisis": 82
      },
      {
        "name": "최원태",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발",
        "stuff": 71,
        "control": 70,
        "stamina": 78,
        "crisis": 78
      },
      {
        "name": "장찬희",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발",
        "stuff": 70,
        "control": 69,
        "stamina": 77,
        "crisis": 54
      },
      {
        "name": "이승민",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조",
        "stuff": 82,
        "control": 85,
        "stamina": 55,
        "crisis": 65
      },
      {
        "name": "배찬승",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조",
        "stuff": 88,
        "control": 72,
        "stamina": 45,
        "crisis": 85
      },
      {
        "name": "이재희",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조",
        "stuff": 92,
        "control": 83,
        "stamina": 45,
        "crisis": 81
      },
      {
        "name": "미야지",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조",
        "stuff": 85,
        "control": 50,
        "stamina": 43,
        "crisis": 70
      },
      {
        "name": "김태훈",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조",
        "stuff": 70,
        "control": 60,
        "stamina": 45,
        "crisis": 45
      },
      {
        "name": "이승현",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 75,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "김무신",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 55,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "김재윤",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리",
        "stuff": 90,
        "control": 88,
        "stamina": 50,
        "crisis": 88
      }
    ]
  },
  {
    "meta": {
      "id": "kt",
      "name": "KT 위즈",
      "shortName": "케이티",
      "primaryColor": "#111827",
      "secondaryColor": "#ffffff",
      "region": "수원",
      "stadium": "수원 KT위즈파크"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "RF",
        "name": "최원준"
      },
      {
        "lineupNo": 2,
        "position": "2B",
        "name": "김상수"
      },
      {
        "lineupNo": 3,
        "position": "1B",
        "name": "김현수"
      },
      {
        "lineupNo": 4,
        "position": "CF",
        "name": "힐리어드"
      },
      {
        "lineupNo": 5,
        "position": "LF",
        "name": "김민혁"
      },
      {
        "lineupNo": 6,
        "position": "3B",
        "name": "허경민"
      },
      {
        "lineupNo": 7,
        "position": "DH",
        "name": "장성우"
      },
      {
        "lineupNo": 8,
        "position": "C",
        "name": "한승택"
      },
      {
        "lineupNo": 9,
        "position": "SS",
        "name": "이강민"
      }
    ],
    "pitchers": [
      {
        "name": "소형준",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발"
      },
      {
        "name": "보쉴리",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발"
      },
      {
        "name": "사우어",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발"
      },
      {
        "name": "고영표",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발"
      },
      {
        "name": "오원석",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발"
      },
      {
        "name": "손동현",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "주권",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "우규민",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "한승혁",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "전용주",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "스기모토",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 70,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "김민수",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 65,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "박영현",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리"
      }
    ]
  },
  {
    "meta": {
      "id": "lg",
      "name": "LG 트윈스",
      "shortName": "엘지",
      "primaryColor": "#ffffff",
      "secondaryColor": "#dc2626",
      "region": "서울",
      "stadium": "잠실야구장"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "RF",
        "name": "홍창기"
      },
      {
        "lineupNo": 2,
        "position": "CF",
        "name": "박해민"
      },
      {
        "lineupNo": 3,
        "position": "1B",
        "name": "오스틴"
      },
      {
        "lineupNo": 4,
        "position": "3B",
        "name": "문보경"
      },
      {
        "lineupNo": 5,
        "position": "LF",
        "name": "문성주"
      },
      {
        "lineupNo": 6,
        "position": "DH",
        "name": "송찬의"
      },
      {
        "lineupNo": 7,
        "position": "SS",
        "name": "오지환"
      },
      {
        "lineupNo": 8,
        "position": "C",
        "name": "박동원"
      },
      {
        "lineupNo": 9,
        "position": "2B",
        "name": "신민재"
      }
    ],
    "pitchers": [
      {
        "name": "웰스",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발"
      },
      {
        "name": "손주영",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발"
      },
      {
        "name": "톨허스트",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발"
      },
      {
        "name": "임찬규",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발"
      },
      {
        "name": "송승기",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발"
      },
      {
        "name": "김진성",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김영우",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "우강훈",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김진수",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "장현식",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "김윤식",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 70,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "이정용",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 65,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "유영찬",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리"
      }
    ]
  },
  {
    "meta": {
      "id": "doosan",
      "name": "두산 베어스",
      "shortName": "두산",
      "primaryColor": "#111827",
      "secondaryColor": "#9ca3af",
      "region": "서울",
      "stadium": "잠실야구장"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "SS",
        "name": "박찬호"
      },
      {
        "lineupNo": 2,
        "position": "3B",
        "name": "박준순"
      },
      {
        "lineupNo": 3,
        "position": "DH",
        "name": "손아섭"
      },
      {
        "lineupNo": 4,
        "position": "RF",
        "name": "카메론"
      },
      {
        "lineupNo": 5,
        "position": "C",
        "name": "양의지"
      },
      {
        "lineupNo": 6,
        "position": "LF",
        "name": "김민석"
      },
      {
        "lineupNo": 7,
        "position": "1B",
        "name": "강승호"
      },
      {
        "lineupNo": 8,
        "position": "2B",
        "name": "박지훈"
      },
      {
        "lineupNo": 9,
        "position": "CF",
        "name": "정수빈"
      }
    ],
    "pitchers": [
      {
        "name": "잭로그",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발"
      },
      {
        "name": "곽빈",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발"
      },
      {
        "name": "벤자민",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발"
      },
      {
        "name": "최민석",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발"
      },
      {
        "name": "최승용",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발"
      },
      {
        "name": "이영하",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김정우",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "박치국",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "이병헌",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "양재훈",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "타무라",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 70,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "박신지",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 65,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "김택연",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리"
      }
    ]
  },
  {
    "meta": {
      "id": "kia",
      "name": "기아 타이거즈",
      "shortName": "KIA",
      "primaryColor": "#dc2626",
      "secondaryColor": "#ffffff",
      "region": "광주",
      "stadium": "광주 기아 챔피언스 필드"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "LF",
        "name": "박재현"
      },
      {
        "lineupNo": 2,
        "position": "SS",
        "name": "윤도현"
      },
      {
        "lineupNo": 3,
        "position": "CF",
        "name": "김호령"
      },
      {
        "lineupNo": 4,
        "position": "3B",
        "name": "김도영"
      },
      {
        "lineupNo": 5,
        "position": "1B",
        "name": "아데를린"
      },
      {
        "lineupNo": 6,
        "position": "RF",
        "name": "나성범"
      },
      {
        "lineupNo": 7,
        "position": "DH",
        "name": "김선빈"
      },
      {
        "lineupNo": 8,
        "position": "C",
        "name": "한준수"
      },
      {
        "lineupNo": 9,
        "position": "2B",
        "name": "김규성"
      }
    ],
    "pitchers": [
      {
        "name": "올러",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발"
      },
      {
        "name": "네일",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발"
      },
      {
        "name": "양현종",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발"
      },
      {
        "name": "황동하",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발"
      },
      {
        "name": "이의리",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발"
      },
      {
        "name": "곽도규",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "조상우",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "정해영",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김범수",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "이태양",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "최지민",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 70,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "전상현",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 65,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "성영탁",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리"
      }
    ]
  },
  {
    "meta": {
      "id": "hanwha",
      "name": "한화 이글스",
      "shortName": "한화",
      "primaryColor": "#f97316",
      "secondaryColor": "#ffffff",
      "region": "대전",
      "stadium": "대전 한화생명 볼파크"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "CF",
        "name": "이원석"
      },
      {
        "lineupNo": 2,
        "position": "RF",
        "name": "페라자"
      },
      {
        "lineupNo": 3,
        "position": "LF",
        "name": "문현빈"
      },
      {
        "lineupNo": 4,
        "position": "DH",
        "name": "강백호"
      },
      {
        "lineupNo": 5,
        "position": "3B",
        "name": "노시환"
      },
      {
        "lineupNo": 6,
        "position": "C",
        "name": "허인서"
      },
      {
        "lineupNo": 7,
        "position": "1B",
        "name": "김태연"
      },
      {
        "lineupNo": 8,
        "position": "2B",
        "name": "이도윤"
      },
      {
        "lineupNo": 9,
        "position": "SS",
        "name": "심우준"
      }
    ],
    "pitchers": [
      {
        "name": "류현진",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발"
      },
      {
        "name": "왕옌청",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발"
      },
      {
        "name": "에르난데스",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발"
      },
      {
        "name": "문동주",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발"
      },
      {
        "name": "정우주",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발"
      },
      {
        "name": "조동욱",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "이민우",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김종수",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "박상원",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "이상규",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "윤산흠",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 70,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "박준영",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 65,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "김서현",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리"
      }
    ]
  },
  {
    "meta": {
      "id": "kiwoom",
      "name": "키움 히어로즈",
      "shortName": "키움",
      "primaryColor": "#7f1d1d",
      "secondaryColor": "#ffffff",
      "region": "서울",
      "stadium": "고척 스카이돔"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "2B",
        "name": "서건창"
      },
      {
        "lineupNo": 2,
        "position": "RF",
        "name": "임병욱"
      },
      {
        "lineupNo": 3,
        "position": "1B",
        "name": "안치홍"
      },
      {
        "lineupNo": 4,
        "position": "DH",
        "name": "최주환"
      },
      {
        "lineupNo": 5,
        "position": "3B",
        "name": "김웅빈"
      },
      {
        "lineupNo": 6,
        "position": "CF",
        "name": "이주형"
      },
      {
        "lineupNo": 7,
        "position": "C",
        "name": "김건희"
      },
      {
        "lineupNo": 8,
        "position": "LF",
        "name": "브룩스"
      },
      {
        "lineupNo": 9,
        "position": "SS",
        "name": "권혁빈"
      }
    ],
    "pitchers": [
      {
        "name": "안우진",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발"
      },
      {
        "name": "알칸타라",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발"
      },
      {
        "name": "배동현",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발"
      },
      {
        "name": "와일스",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발"
      },
      {
        "name": "하영민",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발"
      },
      {
        "name": "김성진",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "박정훈",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "원종현",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김재웅",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "박진형",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "오석주",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 70,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "정다훈",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 65,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "유토",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리"
      }
    ]
  },
  {
    "meta": {
      "id": "lotte",
      "name": "롯데 자이언츠",
      "shortName": "롯데",
      "primaryColor": "#f97316",
      "secondaryColor": "#1e3a8a",
      "region": "부산",
      "stadium": "사직 야구장"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "LF",
        "name": "장두성"
      },
      {
        "lineupNo": 2,
        "position": "CF",
        "name": "윤동희"
      },
      {
        "lineupNo": 3,
        "position": "1B",
        "name": "나승엽"
      },
      {
        "lineupNo": 4,
        "position": "RF",
        "name": "레이예스"
      },
      {
        "lineupNo": 5,
        "position": "2B",
        "name": "고승민"
      },
      {
        "lineupNo": 6,
        "position": "3B",
        "name": "한동희"
      },
      {
        "lineupNo": 7,
        "position": "DH",
        "name": "전준우"
      },
      {
        "lineupNo": 8,
        "position": "C",
        "name": "손성빈"
      },
      {
        "lineupNo": 9,
        "position": "SS",
        "name": "전민재"
      }
    ],
    "pitchers": [
      {
        "name": "비슬리",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발"
      },
      {
        "name": "나균안",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발"
      },
      {
        "name": "로드리게스",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발"
      },
      {
        "name": "박세웅",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발"
      },
      {
        "name": "김진욱",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발"
      },
      {
        "name": "정철원",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "구승민",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김원중",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "윤성빈",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "이민석",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "박정민",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 70,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "김강현",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 65,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "최준용",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리"
      }
    ]
  },
  {
    "meta": {
      "id": "nc",
      "name": "NC 다이노스",
      "shortName": "NC",
      "primaryColor": "#0f172a",
      "secondaryColor": "#fbbf24",
      "region": "창원",
      "stadium": "창원 NC파크"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "SS",
        "name": "김주원"
      },
      {
        "lineupNo": 2,
        "position": "CF",
        "name": "한석형"
      },
      {
        "lineupNo": 3,
        "position": "2B",
        "name": "박민우"
      },
      {
        "lineupNo": 4,
        "position": "RF",
        "name": "박건우"
      },
      {
        "lineupNo": 5,
        "position": "DH",
        "name": "이우성"
      },
      {
        "lineupNo": 6,
        "position": "1B",
        "name": "데이비슨"
      },
      {
        "lineupNo": 7,
        "position": "LF",
        "name": "권희동"
      },
      {
        "lineupNo": 8,
        "position": "C",
        "name": "김형준"
      },
      {
        "lineupNo": 9,
        "position": "2B",
        "name": "최정원"
      }
    ],
    "pitchers": [
      {
        "name": "구창모",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발"
      },
      {
        "name": "토다",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발"
      },
      {
        "name": "테일러",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발"
      },
      {
        "name": "신민혁",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발"
      },
      {
        "name": "버하겐",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발"
      },
      {
        "name": "배재환",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "임지민",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김영규",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김진호",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "이준혁",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "류진욱",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 70,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "임정호",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 65,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "전사민",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리"
      }
    ]
  },
  {
    "meta": {
      "id": "ssg",
      "name": "SSG 랜더스",
      "shortName": "SSG",
      "primaryColor": "#dc2626",
      "secondaryColor": "#facc15",
      "region": "인천",
      "stadium": "인천 SSG 랜더스필드"
    },
    "batters": [
      {
        "lineupNo": 1,
        "position": "SS",
        "name": "박성한"
      },
      {
        "lineupNo": 2,
        "position": "2B",
        "name": "정준재"
      },
      {
        "lineupNo": 3,
        "position": "3B",
        "name": "최정"
      },
      {
        "lineupNo": 4,
        "position": "LF",
        "name": "에레디아"
      },
      {
        "lineupNo": 5,
        "position": "1B",
        "name": "오태곤"
      },
      {
        "lineupNo": 6,
        "position": "DH",
        "name": "김재환"
      },
      {
        "lineupNo": 7,
        "position": "RF",
        "name": "한유섬"
      },
      {
        "lineupNo": 8,
        "position": "C",
        "name": "조형우"
      },
      {
        "lineupNo": 9,
        "position": "CF",
        "name": "최지훈"
      }
    ],
    "pitchers": [
      {
        "name": "화이트",
        "role": "SP",
        "rotationNo": 1,
        "bullpenTier": null,
        "label": "1선발"
      },
      {
        "name": "최민준",
        "role": "SP",
        "rotationNo": 2,
        "bullpenTier": null,
        "label": "2선발"
      },
      {
        "name": "김건우",
        "role": "SP",
        "rotationNo": 3,
        "bullpenTier": null,
        "label": "3선발"
      },
      {
        "name": "베니지아노",
        "role": "SP",
        "rotationNo": 4,
        "bullpenTier": null,
        "label": "4선발"
      },
      {
        "name": "타케다",
        "role": "SP",
        "rotationNo": 5,
        "bullpenTier": null,
        "label": "5선발"
      },
      {
        "name": "문승원",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "노경은",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "이로운",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "SETUP",
        "label": "필승조"
      },
      {
        "name": "김민",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "한두솔",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "MOPUP",
        "label": "패전조"
      },
      {
        "name": "박시후",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 70,
        "control": 65,
        "stamina": 60,
        "crisis": 71
      },
      {
        "name": "장지훈",
        "role": "RP",
        "rotationNo": null,
        "bullpenTier": "LONG",
        "label": "롱릴리프",
        "stuff": 80,
        "control": 65,
        "stamina": 50,
        "crisis": 70
      },
      {
        "name": "조병현",
        "role": "CP",
        "rotationNo": null,
        "bullpenTier": "CLOSER",
        "label": "마무리"
      }
    ]
  }
];

const clamp = (value: number, min = 35, max = 99) => Math.max(min, Math.min(max, Math.round(value)));

const hashScore = (name: string, min: number, max: number) => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 9973;
  return min + (h % (max - min + 1));
};


const teamLevelScores: Record<string, {
  contact: number;
  power: number;
  discipline: number;
  speed: number;
  clutch: number;
  stuff: number;
  control: number;
  stamina: number;
  crisis: number;
}> = {
  samsung: { contact: 5, power: 5, discipline: 5, speed: 5, clutch: 5, stuff: 5, control: 5, stamina: 5, crisis: 5 },
  kt: { contact: 6, power: 5, discipline: 5, speed: 4.5, clutch: 6.5, stuff: 4.5, control: 6, stamina: 5, crisis: 6 },
  lg: { contact: 5, power: 4.5, discipline: 6, speed: 6, clutch: 5.5, stuff: 5.5, control: 6, stamina: 5, crisis: 6 },
  doosan: { contact: 4, power: 4.5, discipline: 4, speed: 6, clutch: 4.5, stuff: 5.5, control: 5.5, stamina: 5, crisis: 6.5 },
  kia: { contact: 5 , power: 7, discipline: 4.5, speed: 5, clutch: 5, stuff: 5.5, control: 5, stamina: 5, crisis: 5.5 },
  hanwha: { contact: 5.5, power: 5.5, discipline: 4, speed: 5, clutch: 6, stuff: 4, control: 3.5, stamina: 5, crisis: 5.5 },
  kiwoom: { contact: 4, power: 3.5, discipline: 4, speed: 4, clutch: 4, stuff: 4, control: 4.5, stamina: 5, crisis: 5.5 },
  lotte: { contact: 4, power: 4.5, discipline: 3, speed: 5.5, clutch: 3.5, stuff: 5, control: 4, stamina: 5, crisis: 5 },
  nc: { contact: 4, power: 4, discipline: 4, speed: 7, clutch: 5, stuff: 6, control: 4, stamina: 5, crisis: 5.5 },
  ssg: { contact: 4.5, power: 5, discipline: 4.5, speed: 6, clutch: 6, stuff: 5, control: 3.5, stamina: 5, crisis: 5.5 },
};

const levelBonus = (teamId: string, key: keyof typeof teamLevelScores["samsung"]) => {
  const teamScore = teamLevelScores[teamId]?.[key] ?? 5;
  // 삼성 5점을 기준으로 1점 차이당 약 3.2 능력치 포인트를 보정한다.
  // 너무 큰 쏠림을 막기 위해 팀 보정은 -9~+9 사이로 제한한다.
  return clamp((teamScore - 5) * 3.0, -9, 9);
};

const defaultBatterRatings = (batter: RawBatter): BatterRatings => {
  const n = batter.lineupNo;
  const jitter = hashScore(batter.name, -3, 3);

  if (n === 1) return {
    contact: clamp(78 + jitter),
    power: clamp(55 + hashScore(batter.name, -8, 8)),
    discipline: clamp(74 + hashScore(batter.name, -5, 5)),
    speed: clamp(84 + hashScore(batter.name, -6, 6)),
    clutch: clamp(67 + hashScore(batter.name, -5, 5)),
  };

  if (n === 2) return {
    contact: clamp(80 + jitter),
    power: clamp(55 + hashScore(batter.name, -8, 8)),
    discipline: clamp(72 + hashScore(batter.name, -5, 5)),
    speed: clamp(78 + hashScore(batter.name, -7, 7)),
    clutch: clamp(66 + hashScore(batter.name, -5, 5)),
  };

  if (n === 3) return {
    contact: clamp(84 + jitter),
    power: clamp(80 + hashScore(batter.name, -7, 7)),
    discipline: clamp(74 + hashScore(batter.name, -6, 6)),
    speed: clamp(66 + hashScore(batter.name, -8, 8)),
    clutch: clamp(80 + hashScore(batter.name, -5, 5)),
  };

  if (n === 4) return {
    contact: clamp(80 + jitter),
    power: clamp(91 + hashScore(batter.name, -5, 5)),
    discipline: clamp(71 + hashScore(batter.name, -6, 6)),
    speed: clamp(48 + hashScore(batter.name, -8, 8)),
    clutch: clamp(86 + hashScore(batter.name, -5, 5)),
  };

  if (n === 5) return {
    contact: clamp(79 + jitter),
    power: clamp(85 + hashScore(batter.name, -7, 7)),
    discipline: clamp(70 + hashScore(batter.name, -6, 6)),
    speed: clamp(55 + hashScore(batter.name, -8, 8)),
    clutch: clamp(80 + hashScore(batter.name, -5, 5)),
  };

  if (n <= 7) return {
    contact: clamp(75 + jitter),
    power: clamp(70 + hashScore(batter.name, -9, 9)),
    discipline: clamp(63 + hashScore(batter.name, -6, 6)),
    speed: clamp(67 + hashScore(batter.name, -8, 8)),
    clutch: clamp(66 + hashScore(batter.name, -7, 7)),
  };

  return {
    contact: clamp(77 + jitter),
    power: clamp(58 + hashScore(batter.name, -9, 9)),
    discipline: clamp(58 + hashScore(batter.name, -6, 6)),
    speed: clamp(68 + hashScore(batter.name, -10, 10)),
    clutch: clamp(58 + hashScore(batter.name, -7, 7)),
  };
};

const defaultPitcherRatings = (pitcher: RawPitcher): PitcherRatings => {
  const name = pitcher.name;

  if (pitcher.role === "SP") {
    const rotation = pitcher.rotationNo ?? 5;
    const base = 92 - rotation * 5;
    return {
      stuff: clamp(base +2+ hashScore(name, -4, 4)),
      control: clamp(base - 2 + hashScore(name, -5, 5)),
      stamina: clamp(96 - rotation * 5 + hashScore(name, -4, 4), 55, 99),
      crisis: clamp(base - 1 + hashScore(name, -5, 5)),
    };
  }

  if (pitcher.bullpenTier === "SETUP") {
    return {
      stuff: clamp(82 + hashScore(name, -6, 6)),
      control: clamp(76 + hashScore(name, -7, 7)),
      stamina: clamp(52 + hashScore(name, -5, 5), 35, 65),
      crisis: clamp(82 + hashScore(name, -6, 6)),
    };
  }

  if (pitcher.bullpenTier === "LONG") {
    return {
      stuff: 70,
      control: 65,
      stamina: 60,
      crisis: 71,
    };
  }

  if (pitcher.bullpenTier === "CLOSER") {
    return {
      stuff: clamp(90 + hashScore(name, -5, 5)),
      control: clamp(82 + hashScore(name, -6, 6)),
      stamina: clamp(52 + hashScore(name, -4, 4), 35, 65),
      crisis: clamp(90 + hashScore(name, -5, 5)),
    };
  }

  return {
    stuff: clamp(68 + hashScore(name, -8, 8)),
    control: clamp(64 + hashScore(name, -8, 8)),
    stamina: clamp(47 + hashScore(name, -5, 5), 35, 60),
    crisis: clamp(62 + hashScore(name, -8, 8)),
  };
};

export const emptyBatterStats = () => ({
  games: 0,
  plateAppearances: 0,
  atBats: 0,
  runs: 0,
  hits: 0,
  doubles: 0,
  triples: 0,
  homeRuns: 0,
  rbi: 0,
  walks: 0,
  sacFlies: 0,
  strikeouts: 0,
  gidp: 0,
  rispAtBats: 0,
  rispHits: 0,
  contribution: 0,
  gameMvp: 0,
  highlights: 0,
});

export const emptyPitcherStats = () => ({
  games: 0,
  outs: 0,
  earnedRuns: 0,
  wins: 0,
  losses: 0,
  saves: 0,
  holds: 0,
  strikeouts: 0,
  walks: 0,
  hitsAllowed: 0,
  homeRunsAllowed: 0,
  contribution: 0,
  gameMvp: 0,
  highlights: 0,
  blownSaves: 0,
  qualityStarts: 0,
});

export const createInitialTeams = (): TeamState[] => rawTeams.map((team) => {
  const batters: BatterData[] = team.batters.map((raw) => {
    const baseRatings = {
      ...defaultBatterRatings(raw),
      ...(raw.contact !== undefined ? {
        contact: raw.contact,
        power: raw.power ?? 60,
        discipline: raw.discipline ?? 60,
        speed: raw.speed ?? 60,
        clutch: raw.clutch ?? 60,
      } : {}),
    };

    // 전체 리그가 지나치게 투고타저로 흐르지 않도록 컨택은 아주 조금,
    // 파워는 소폭 올린 최종 게임용 보정값을 적용한다.
    const ratings = {
      ...baseRatings,
      contact: clamp(baseRatings.contact + 2 + levelBonus(team.meta.id, "contact")),
      power: clamp(baseRatings.power + 7 + levelBonus(team.meta.id, "power")),
      discipline: clamp(baseRatings.discipline + levelBonus(team.meta.id, "discipline")),
      speed: clamp(baseRatings.speed + levelBonus(team.meta.id, "speed")),
      clutch: clamp(baseRatings.clutch + levelBonus(team.meta.id, "clutch")),
    };

    return {
      id: `${team.meta.id}-B-${raw.lineupNo}`,
      teamId: team.meta.id,
      lineupNo: raw.lineupNo,
      position: raw.position,
      name: raw.name,
      ...ratings,
      stats: emptyBatterStats(),
    };
  });

  const pitchers: PitcherData[] = team.pitchers.map((raw, index) => {
    const basePitchingRatings = {
      ...defaultPitcherRatings(raw),
      ...(raw.stuff !== undefined ? {
        stuff: raw.stuff,
        control: raw.control ?? 65,
        stamina: raw.stamina ?? 60,
        crisis: raw.crisis ?? 65,
      } : {}),
    };

    const ratings = raw.bullpenTier === "LONG"
      ? { ...basePitchingRatings }
      : {
          ...basePitchingRatings,
          stuff: clamp(basePitchingRatings.stuff + levelBonus(team.meta.id, "stuff")),
          control: clamp(basePitchingRatings.control + levelBonus(team.meta.id, "control")),
          stamina: clamp(basePitchingRatings.stamina + levelBonus(team.meta.id, "stamina"), raw.role === "SP" ? 55 : 35, raw.role === "SP" ? 99 : 65),
          crisis: clamp(basePitchingRatings.crisis + levelBonus(team.meta.id, "crisis")),
        };

    return {
      id: `${team.meta.id}-P-${index + 1}`,
      teamId: team.meta.id,
      name: raw.name,
      role: raw.role,
      label: raw.label,
      rotationNo: raw.rotationNo,
      bullpenTier: raw.bullpenTier,
      ...ratings,
      stats: emptyPitcherStats(),
    };
  });

  const headToHead = Object.fromEntries(rawTeams.map((other) => [other.meta.id, {
    wins: 0,
    draws: 0,
    losses: 0,
    runsFor: 0,
    runsAgainst: 0,
    homeWins: 0,
    awayWins: 0,
  }]));

  return {
    ...team.meta,
    batters,
    pitchers,
    lineupIndex: 0,
    starterIndex: 0,
    record: {
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      runsFor: 0,
      runsAgainst: 0,
      streakType: "",
      streakCount: 0,
      recent: [],
      headToHead,
    },
  };
});