# CLAUDE.md - F2F-Web-Sample

## 프로젝트 개요

F2F-Engine을 사용하는 웹 기반 텍스트 어드벤처 게임 클라이언트.

- **게임**: 상인 마을의 실종 사건 (중세 판타지)
- **UI**: 터미널 스타일 (녹색 텍스트, 검은 배경)
- **역할**: F2F-Engine의 Directive를 받아 UI로 표시하고, 플레이어 행동을 Fact로 변환하여 Engine에 전송

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16 | App Router, Turbopack, Server Actions |
| React | 19 | UI (React Compiler 활성화) |
| TypeScript | 5.9 | 타입 안전성 |
| Zustand | 5.0 | 클라이언트 상태 관리 |

## 프로젝트 구조

```
app/                      # Next.js App Router
├── page.tsx              # 메인 메뉴 (새 게임/불러오기)
├── game/page.tsx         # 게임 화면
└── globals.css           # 터미널 테마

components/game/          # 게임 UI 컴포넌트
├── GameTerminal.tsx      # 메인 터미널 컨테이너
├── MessageLog.tsx        # 메시지 로그
├── DirectivePanel.tsx    # Directive 표시 (목표, 선택지)
├── ActionInput.tsx       # 명령어 입력
├── StatusBar.tsx         # 상태 표시 (HP, 골드)
└── SignalIndicator.tsx   # 시그널 표시

lib/
├── engine/
│   ├── client.ts         # F2F-Engine HTTP 클라이언트
│   ├── actions.ts        # Server Actions (Engine API 호출)
│   └── types.ts          # F2F-Engine 타입 정의
├── game/
│   ├── capabilities.ts   # 게임 내 위치/NPC 정보
│   └── fact-builder.ts   # Fact 생성 유틸
├── hooks/
│   ├── useGameSession.ts # 게임 세션 관리
│   └── useDirective.ts   # Directive 구독
└── saves/
    └── save-manager.ts   # 저장/불러오기 (localStorage)

stores/
└── game-store.ts         # Zustand 전역 상태
```

## F2F-Engine 연동

### API 엔드포인트 (lib/engine/client.ts)

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| GET | `/health` | 헬스 체크 |
| POST | `/v1/sessions/start` | 세션 시작 |
| POST | `/v1/capabilities/set` | 게임 능력 설정 |
| POST | `/v1/world/snapshot` | 월드 상태 업데이트 |
| POST | `/v1/facts/ingest` | Fact 전송 |
| POST | `/v1/session/tick` | Directive 생성 트리거 |
| GET | `/v1/directives/current` | 현재 Directive 조회 |

### 데이터 흐름

```
[Player Action] → [Fact 생성] → [Engine 전송] → [Directive 수신] → [UI 표시]
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

---

## Engine 수정 요청 처리 가이드

### 판단 기준

사용자의 요청이 다음에 해당하면 **Engine 수정이 필요**:

1. **Directive 생성 로직 변경**: 선택지 생성 방식, AI 프롬프트 수정
2. **새로운 API 엔드포인트 필요**: 현재 없는 기능 요청
3. **시그널/스코어링 변경**: TENSION, REPETITION 등 계산 방식
4. **월드 스펙 변경**: 허용 태그, 금지 키워드, 스타일 가이드
5. **Fact 처리 로직 변경**: 새로운 verb 타입 지원

반면, 다음은 **Web에서 처리 가능**:
- UI/UX 변경
- 클라이언트 상태 관리
- Fact 생성 (기존 verb 사용)
- 저장/불러오기
- 스타일링

### Engine 개발자 요청서 템플릿

Engine 수정이 필요한 경우, 아래 형식으로 요구사항을 작성:

```markdown
# F2F-Engine 수정 요청

## 요청 개요
[한 줄 요약]

## 현재 상황
- 현재 동작: [현재 어떻게 동작하는지]
- 문제점/한계: [왜 수정이 필요한지]

## 요청 사항

### 1. [구체적인 수정 항목]
- **영향 범위**: [어떤 모듈/파일에 영향]
- **상세 내용**: [무엇을 어떻게 변경]
- **예상 결과**: [변경 후 기대 동작]

### 2. [추가 수정 항목이 있다면]
...

## API 변경 (해당시)

### 새 엔드포인트
```
POST /v1/example/endpoint
Request: { ... }
Response: { ... }
```

### 기존 엔드포인트 수정
```
변경 전: { ... }
변경 후: { ... }
```

## Web 클라이언트 연동 계획
- Web에서 이 기능을 어떻게 사용할 예정인지
- 필요한 타입 정의 (types.ts에 추가할 내용)

## 우선순위
[ ] 긴급 (게임 플레이 불가)
[ ] 높음 (핵심 기능)
[ ] 보통 (개선 사항)
[ ] 낮음 (nice-to-have)

## 참고 사항
[추가 컨텍스트, 관련 이슈 등]
```

### 예시: Directive에 난이도 표시 추가 요청

```markdown
# F2F-Engine 수정 요청

## 요청 개요
Directive에 난이도(difficulty) 필드 추가

## 현재 상황
- 현재 동작: Directive에 objective_text, choices, clues만 포함
- 문제점/한계: 플레이어에게 선택의 난이도를 표시할 수 없음

## 요청 사항

### 1. Directive 모델에 difficulty 필드 추가
- **영향 범위**: `models.py` Directive 클래스
- **상세 내용**:
  - `difficulty: int` 필드 추가 (1-5 스케일)
  - Directive 생성 시 선택지별 난이도 계산
- **예상 결과**: Directive 응답에 difficulty 포함

## API 변경

### 기존 엔드포인트 수정
```json
// GET /v1/directives/current 응답
변경 전: { "directive_id": "...", "choices": [...] }
변경 후: { "directive_id": "...", "choices": [...], "difficulty": 3 }
```

## Web 클라이언트 연동 계획
- DirectivePanel.tsx에서 difficulty에 따라 색상 표시
- types.ts의 Directive 인터페이스에 difficulty 추가

## 우선순위
[x] 보통 (개선 사항)
```
