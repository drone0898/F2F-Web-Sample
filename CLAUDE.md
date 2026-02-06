# CLAUDE.md - F2F-Web-Sample

## 프로젝트 개요

F2F-Engine을 사용하는 웹 기반 텍스트 어드벤처 게임 클라이언트.
**공식 SDK (`@f2f-engine/sdk`)를 사용하여 엔진과 통신합니다.**

- **게임**: 상인 마을의 실종 사건 (중세 판타지)
- **UI**: 터미널 스타일 (녹색 텍스트, 검은 배경)
- **역할**: F2F-Engine의 Experience를 받아 UI로 표시하고, 플레이어 행동을 Fact로 변환하여 Engine에 전송

## 용어 매핑 (SDK 마이그레이션)

| 이전 용어 | SDK 용어 |
|-----------|---------|
| Directive | Experience |
| DirectiveLite | ExperienceLite |
| directive_id | experience_id |
| objective_text | title + summary |
| choices (최상위) | payload.choices |
| clues (최상위) | payload.clues |
| ChoiceResult | *(제거됨)* |
| TickMode "lite"/"both" | "soft_fast" |
| directive_payload_schema | experience_payload_schema + payload_specs |

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16 | App Router, Turbopack, Server Actions |
| React | 19 | UI (React Compiler 활성화) |
| TypeScript | 5.9 | 타입 안전성 |
| Zustand | 5.0 | 클라이언트 상태 관리 |
| @f2f-engine/sdk | 0.1.0 | F2F-Engine 공식 SDK |

## 프로젝트 구조

```
app/                      # Next.js App Router
├── page.tsx              # 메인 메뉴 (새 게임/불러오기)
├── game/page.tsx         # 게임 화면
└── globals.css           # 터미널 테마

components/game/          # 게임 UI 컴포넌트
├── GameTerminal.tsx      # 메인 터미널 컨테이너
├── MessageLog.tsx        # 메시지 로그
├── ExperiencePanel.tsx   # Experience 표시 (목표, 선택지)
├── ActionInput.tsx       # 명령어 입력
├── StatusBar.tsx         # 상태 표시 (HP, 골드)
└── SignalIndicator.tsx   # 시그널 표시

lib/
├── engine/
│   ├── sdk-bridge.ts     # SDK 재수출 + 앱 전용 타입/헬퍼
│   └── actions.ts        # Server Actions (SDK F2FClient 사용)
├── game/
│   ├── capabilities.ts   # 게임 내 위치/NPC 정보
│   ├── fact-builder.ts   # Fact 생성 유틸
│   ├── templates.ts      # 게임 템플릿 시스템
│   ├── outcome-ops.ts    # 결과→월드상태 변환
│   └── success-resolver.ts # 선택 성공 판정
├── hooks/
│   ├── useGameSession.ts # 게임 세션 관리
│   ├── useExperience.ts  # Experience 구독
│   └── useSSEStream.ts   # SSE 연결 (SDK streamExperiences)
└── saves/
    └── save-manager.ts   # 저장/불러오기 (localStorage)

stores/
└── game-store.ts         # Zustand 전역 상태
```

## Import 규칙

- **SDK 타입/클래스**: `@/lib/engine/sdk-bridge` 에서 import
- **직접 SDK import 금지**: 항상 sdk-bridge를 통해 접근
- **앱 전용 타입** (Choice, GameMessage, GameState): `@/lib/engine/sdk-bridge` 에서 import

## F2F-Engine 연동 (SDK 기반)

### SDK Client 사용 (lib/engine/actions.ts)

| SDK 메서드 | 용도 |
|-----------|------|
| `client.startSession()` | 세션 시작 |
| `client.setCapabilities()` | 게임 능력 설정 |
| `client.setWorldSnapshot()` | 월드 상태 업데이트 |
| `client.ingestFacts()` | Fact 전송 |
| `client.tick()` | Experience 생성 트리거 |
| `client.getCurrentExperience()` | 현재 Experience 조회 |
| `client.streamExperiences()` | SSE 스트리밍 (async generator) |

### 데이터 흐름

```
[Player Action] → [Fact 생성] → [SDK로 Engine 전송] → [Experience 수신] → [UI 표시]
```

## 실행 방법

```bash
# 개발 서버 (Engine은 별도 실행)
npm run dev

# Docker로 전체 실행
docker-compose up
```

## 환경 변수

| 파일 | 용도 |
|------|------|
| `.env.local` | 로컬 개발 (`F2F_ENGINE_URL=http://localhost:5001`) |
| `.env.production` | 프로덕션 배포 |
| `docker-compose.yaml` | Docker 환경 (`http://engine:5001`) |
