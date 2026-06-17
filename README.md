# InnoTrader V3.2

InnoTrader V3.2는 Spring Boot 4.0 + Next.js 기반의 트레이딩 플랫폼입니다.
실시간 데이터 처리와 높은 확장성을 목표로 설계되었습니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Spring Boot 4.0, Java 21, Gradle |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Database | PostgreSQL 16 |
| Cache / Broker | Redis 7 |
| Container | Docker / Docker Compose |

---

## 로컬 실행 방법

### 사전 요구사항

- Docker Desktop (PostgreSQL + Redis 컨테이너 실행용)
- Java 21 (JDK)
- Node.js 20+

### 1단계 — 인프라 컨테이너 시작

```bash
docker compose up -d
```

Redis Commander UI 포함 실행 시:

```bash
docker compose --profile tools up -d
```

서비스 접속 정보:

| 서비스 | URL / 포트 |
|--------|-----------|
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| Redis Commander | http://localhost:8081 |

### 2단계 — Backend 실행

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

기본 포트: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 3단계 — Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

기본 포트: `http://localhost:3000`

---

## 환경변수 설정

### Backend

`backend/src/main/resources/` 아래에 `application-local.yml` 파일을 생성합니다.
예시 파일은 `application-local.yml.example`을 참고하세요.

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/innotrader
    username: innotrader
    password: innotrader
```

> `application-local.yml` 파일은 `.gitignore`에 포함되어 있어 저장소에 커밋되지 않습니다.

### Frontend

`frontend/` 디렉터리에 `.env.local` 파일을 생성합니다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

> `.env*.local` 파일도 `.gitignore`에 포함되어 있습니다.

---

## 아키텍처 개요

전체 시스템 아키텍처, 모듈 구조, 에이전트 역할 분담은 [AGENTS.md](./AGENTS.md)를 참조하세요.

---

## 기여 가이드

1. feature 브랜치 생성: `git checkout -b feature/your-feature`
2. 변경 사항 커밋
3. Pull Request 생성 후 리뷰 요청
