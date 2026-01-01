# F2F Web Sample

F2F-Engine을 사용하는 웹 기반 텍스트 어드벤처 게임입니다.

## 개요

**상인 마을의 실종 사건** - 중세 판타지 배경의 텍스트 어드벤처 게임

플레이어는 상인 마을에 도착한 여행자로, 연이은 실종 사건을 조사하게 됩니다.
F2F-Engine이 플레이어의 행동을 분석하고, 동적으로 이야기와 선택지를 생성합니다.

### 주요 기능

- **터미널 스타일 UI**: 클래식 텍스트 어드벤처 느낌의 인터페이스
- **동적 스토리**: F2F-Engine이 플레이어 행동 기반으로 Directive 생성
- **선택 기반 게임플레이**: 선택지를 통한 스토리 분기
- **상태 관리**: HP, 골드, 평판 등 게임 상태 추적

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.1 | React 프레임워크 (Turbopack, App Router) |
| React | 19.2 | UI 라이브러리 |
| TypeScript | 5.9 | 타입 안전성 |
| Zustand | 5.0 | 상태 관리 |
| F2F-Engine | - | 게임 디렉팅 엔진 |

## 프로젝트 구조

```
F2F-web-sample/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 홈 화면 (게임 시작)
│   ├── game/page.tsx       # 게임 메인 화면
│   └── globals.css         # 터미널 테마 CSS
├── components/game/        # 게임 UI 컴포넌트
├── lib/
│   ├── engine/             # F2F-Engine 통합
│   ├── game/               # 게임 로직
│   └── hooks/              # React 훅
├── stores/                 # Zustand 상태 관리
├── docs/ref/               # 기술 스택 참조 문서
├── Dockerfile              # 프로덕션 빌드
└── docker-compose.yaml     # 로컬 개발 환경
```

## 설치

### 사전 요구사항

- Node.js 20.9+
- Docker & Docker Compose (선택)
- F2F-Engine (../F2F-Engine 경로에 위치)

### 의존성 설치

```bash
npm install
```

## 실행 방법

### 방법 1: 개발 서버 (웹만)

F2F-Engine 없이 오프라인 모드로 실행:

```bash
npm run dev
```

http://localhost:3000 접속

> 오프라인 모드에서는 F2F-Engine 기능 없이 기본 UI만 확인 가능

### 방법 2: Docker Compose (웹 + 엔진)

F2F-Engine과 함께 전체 시스템 실행:

```bash
# 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d
```

- 웹: http://localhost:3000
- 엔진: http://localhost:5001

### 방법 3: 프로덕션 빌드

```bash
# 빌드
npm run build

# 실행
npm run start
```

## 첫 실행 테스트

### 1. 엔진 상태 확인

```bash
# F2F-Engine health check
curl http://localhost:5001/health
# 응답: {"status":"ok"}

# 버전 확인
curl http://localhost:5001/version
```

### 2. 웹 앱 확인

```bash
# 웹 앱 접속
curl -I http://localhost:3000
# 응답: HTTP/1.1 200 OK
```

### 3. 게임 플레이 테스트

1. http://localhost:3000 접속
2. **[ 게임 시작 ]** 버튼 클릭
3. 게임 화면에서:
   - 메시지 로그 확인 (좌측)
   - 상태 바 확인 (우측: HP, 골드, 위치)
   - 하단 명령어 입력창 확인

### 4. 기본 명령어 테스트

```
# 이동 명령
go tavern          # 여관으로 이동
go market          # 시장으로 이동

# 조사 명령
look around        # 주변 살펴보기
examine door       # 문 조사하기

# 대화 명령
talk innkeeper     # 여관 주인과 대화

# 기타
rest               # 휴식
help               # 도움말
```

### 5. F2F-Engine 연동 테스트

엔진이 연결되면:
1. 플레이어 행동이 Fact로 변환되어 엔진에 전송
2. 엔진이 Directive(목표, 선택지, 단서) 생성
3. 화면에 선택지 버튼 표시
4. 숫자 키(1-4)로 선택 가능

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `F2F_ENGINE_URL` | F2F-Engine 서버 URL | `http://localhost:5001` |
| `NODE_ENV` | 실행 환경 | `development` |

### 환경 변수 설정

```bash
# .env.local (로컬 개발)
F2F_ENGINE_URL=http://localhost:5001

# .env.production (프로덕션)
F2F_ENGINE_URL=https://f2f-engine-xxxxx.run.app
```

## Docker 명령어

```bash
# 시작
docker-compose up

# 백그라운드 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 웹 로그만
docker-compose logs -f web

# 엔진 로그만
docker-compose logs -f engine

# 중지
docker-compose down

# 이미지 재빌드
docker-compose up --build
```

## 문제 해결

### 엔진 연결 실패

```
F2F-Engine에 연결할 수 없습니다. 오프라인 모드로 시작합니다.
```

**해결방법:**
1. F2F-Engine이 실행 중인지 확인
2. `F2F_ENGINE_URL` 환경 변수 확인
3. 방화벽/네트워크 설정 확인

### Docker 빌드 실패

```bash
# 캐시 없이 재빌드
docker-compose build --no-cache

# 볼륨 정리 후 재시작
docker-compose down -v
docker-compose up --build
```

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :3000
lsof -i :5001

# 프로세스 종료
kill -9 <PID>
```

## 배포 (GCP Cloud Run)

```bash
# Cloud Build로 배포
gcloud builds submit --config cloudbuild.yaml

# 또는 수동 배포
docker build -t gcr.io/PROJECT_ID/f2f-web .
docker push gcr.io/PROJECT_ID/f2f-web
gcloud run deploy f2f-web --image gcr.io/PROJECT_ID/f2f-web
```

## 참고 문서

- [Next.js 16 참조](./docs/ref/nextjs16.md)
- [React 19 참조](./docs/ref/react19.md)
- [F2F-Engine 문서](../F2F-Engine/spec/)

## 라이선스

Private
