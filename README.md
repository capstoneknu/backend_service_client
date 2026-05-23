# 우리집 전기 저금통 (Mobile App & Backend API)

AI 기반 스마트 그리드 수요반응(DR) 서비스의 **사용자 대면 모바일 애플리케이션** 및 **백엔드 API 서버**입니다.

본 레포지토리는 A파트(AI & Data Pipeline)에서 수집·예측된 전력 데이터를 사용자에게 시각화하고,
DR 이벤트 참여, 에너지 절약 미션, 포인트 리워드 등의 비즈니스 로직을 처리하는 End-to-End 서비스 레이어입니다.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        [A파트 인프라]                              │
│  가상 ESP32 센서 → Kafka (power-usage-topic) → InfluxDB          │
│                           │                                      │
│                    LSTM 수요 예측 → ANFIS 미션 생성                 │
│                           │              │                       │
│                    FastAPI (/api/v1/missions/generate)            │
└───────────┬───────────────┴──────────────┘                       │
            │ Kafka Consume              │ HTTP 호출                │
            ▼                            ▼                         │
┌─────────────────────────────────────────────────────────────────┐
│                        [B파트 백엔드]                              │
│  Spring Boot 3.2.5 (포트 8081)                                   │
│  ├── JWT 인증 (로그인/회원가입)                                     │
│  ├── Kafka Consumer → MySQL 저장 + WebSocket 브로드캐스트          │
│  ├── REST API (에너지, DR, 미션, 포인트, 프로필)                    │
│  └── MySQL 8.0 (Docker) — 사용자/비즈니스 데이터 영속 저장          │
└───────────────────────┬─────────────────────────────────────────┘
                        │ REST API + WebSocket
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      [B파트 모바일 앱]                             │
│  React Native (JavaScript)                                       │
│  ├── 홈: 실시간 전력 대시보드 (도넛 차트 + 시간대별 라인 차트)       │
│  ├── DR 이벤트: 참여/알림 설정/이력 조회                            │
│  ├── 미션: 카테고리별 에너지 절약 미션 + 진행도 관리                 │
│  ├── 포인트: 적립/사용 내역 + QR 결제                               │
│  └── 마이페이지: 프로필/통계/에코 레벨/설정                         │
└─────────────────────────────────────────────────────────────────┘
```

### 핵심 기술 스택

| 계층 | 기술 | 버전 | 역할 |
|------|------|------|------|
| Mobile App | React Native (CLI) | 0.76+ | 크로스 플랫폼 모바일 앱 |
| 상태 관리 | Zustand | 4.x | 경량 글로벌 상태 관리 |
| 차트 | react-native-svg | - | SVG 기반 도넛/라인 차트 |
| Backend | Spring Boot | 3.2.5 | REST API 서버 |
| 인증 | Spring Security + JWT (JJWT) | - | 토큰 기반 인증/인가 |
| Database | MySQL | 8.0 | 비즈니스 데이터 영속 저장 |
| 메시징 | Spring Kafka | - | A파트 Kafka 토픽 소비 |
| 실시간 | WebSocket | - | 전력 데이터 실시간 전송 |
| 인프라 | Docker | - | MySQL 컨테이너 |

---

## 주요 기능

### 📱 모바일 앱 (React Native)

- **에너지 대시보드**: 실시간 전력 사용량 도넛 차트, 시간대별 실제 vs AI 예측 라인 차트, 월 목표 대비 진행률
- **DR 이벤트**: 수요반응 이벤트 참여/알림 설정, 절감 목표 프로그레스 바, 과거 참여 이력 상세 조회
- **에너지 미션**: 카테고리별(DR/냉난방/가전/종합) 필터링, 미션 진행도 관리, 완료 시 자동 포인트 적립
- **포인트 & 리워드**: 적립/사용 내역 관리, QR코드 결제 바텀시트, 강원도 지역 가맹점 연동
- **마이페이지**: 에너지 절약 통계, 월간 리포트, 에코 레벨 시스템, IoT 기기 관리, 알림 설정(Switch)
- **인증**: 로그인/회원가입(2단계 폼), 비밀번호 표시/숨김, 에러 Shake 애니메이션, 소셜 로그인(목업)

### 🖥️ 백엔드 API (Spring Boot)

- **JWT 인증**: 회원가입, 로그인, 토큰 기반 API 보호
- **에너지 데이터**: Kafka 소비 → DB 저장 → WebSocket 실시간 전송
- **DR 이벤트**: 이벤트 CRUD, 참여 처리, 알림 토글, 참여 이력 관리
- **미션**: 카테고리별 조회, 진행도 관리, 완료 시 포인트 자동 적립
- **포인트**: 포인트 요약/내역 조회, 포인트 사용 처리
- **초기 데이터**: DataInitializer로 서버 시작 시 테스트 데이터 자동 생성

---

## Project Structure

```
# Backend (Spring Boot)
energy-api/
 ├── build.gradle                           # Gradle 빌드 설정 (Spring Boot 3.2.5)
 ├── src/main/resources/
 │   └── application.yml                    # DB, Kafka, JWT, 서버 포트 설정
 └── src/main/java/com/energy/api/
     ├── EnergyApiApplication.java          # 애플리케이션 진입점
     ├── config/
     │   ├── SecurityConfig.java            # Spring Security + CORS + JWT 필터 체인
     │   ├── JwtUtil.java                   # JWT 토큰 생성/검증 유틸리티
     │   ├── JwtAuthenticationFilter.java   # 요청마다 JWT 검증하는 필터
     │   ├── WebSocketConfig.java           # WebSocket 엔드포인트 등록
     │   └── DataInitializer.java           # 서버 시작 시 테스트 데이터 자동 생성
     ├── controller/
     │   ├── AuthController.java            # 로그인/회원가입/내 정보 API
     │   ├── EnergyController.java          # 에너지 대시보드 API
     │   ├── DREventController.java         # DR 이벤트 참여/이력 API
     │   ├── MissionController.java         # 미션 조회/진행도 API
     │   └── PointController.java           # 포인트 조회/사용 API
     ├── dto/
     │   ├── AuthDto.java                   # 인증 요청/응답 DTO
     │   └── AppDto.java                    # 비즈니스 요청/응답 DTO + 공통 ApiResponse
     ├── entity/
     │   ├── User.java                      # 사용자 엔티티
     │   ├── EnergyData.java                # 시간별 전력 사용 데이터
     │   ├── DREvent.java                   # DR 이벤트
     │   ├── DRParticipation.java           # DR 이벤트 참여 기록
     │   ├── Mission.java                   # 에너지 미션 정의
     │   ├── MissionProgress.java           # 사용자별 미션 진행도
     │   └── PointHistory.java              # 포인트 적립/사용 내역
     ├── repository/                        # Spring Data JPA 인터페이스 (7개)
     └── service/
         ├── AuthService.java               # 인증 비즈니스 로직
         ├── EnergyService.java             # 대시보드 데이터 조회
         ├── DREventService.java            # DR 이벤트 참여/이력 처리
         ├── MissionService.java            # 미션 진행도 + 포인트 적립
         ├── PointService.java              # 포인트 사용 처리
         ├── KafkaConsumerService.java       # Kafka → DB 저장 + WebSocket 전송
         └── EnergyWebSocketHandler.java    # WebSocket 세션 관리 + 브로드캐스트

# Mobile App (React Native)
MyApp/
 ├── App.js                                 # Auth Stack ↔ Main Tab 분기
 ├── api/
 │   ├── apiClient.js                       # REST API 호출 클라이언트
 │   └── useWebSocket.js                    # WebSocket 실시간 데이터 수신 훅
 ├── store/
 │   ├── authStore.js                       # 인증 상태 관리 (Zustand)
 │   └── store.js                           # 에너지/DR/미션/포인트/프로필 스토어
 ├── components/
 │   └── Modals.js                          # 확인 다이얼로그, 토스트, QR결제, 이벤트 상세
 └── screens/
     ├── LoginScreen.js                     # 로그인 (이메일/비밀번호 + 소셜)
     ├── SignUpScreen.js                    # 회원가입 (2단계: 계정정보 → 프로필)
     ├── SignUpCompleteScreen.js            # 가입 완료 축하 화면
     ├── HomeScreen.js                      # 에너지 대시보드 (실시간 차트)
     ├── DREventScreen.js                   # DR 이벤트 (참여/알림/이력)
     ├── MissionScreen.js                   # 에너지 미션 (카테고리 필터)
     ├── PointScreen.js                     # 포인트 & 리워드 (QR결제)
     └── MyPageScreen.js                    # 마이페이지 (설정/통계/로그아웃)
```

---

## API 명세

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| POST | `/api/auth/signup` | ✗ | 회원가입 |
| POST | `/api/auth/login` | ✗ | 로그인 → JWT 토큰 발급 |
| GET | `/api/auth/me` | ✓ | 내 정보 조회 |
| GET | `/api/energy/dashboard` | ✓ | 대시보드 데이터 (전력/차트/통계) |
| GET | `/api/dr/events` | ✓ | 오늘 DR 이벤트 목록 |
| POST | `/api/dr/events/{id}/participate` | ✓ | DR 이벤트 참여 |
| POST | `/api/dr/events/{id}/notification` | ✓ | DR 알림 설정 토글 |
| GET | `/api/dr/history` | ✓ | DR 참여 이력 |
| GET | `/api/missions?category=전체` | ✓ | 미션 목록 (카테고리 필터) |
| POST | `/api/missions/{id}/progress` | ✓ | 미션 진행도 +1 |
| GET | `/api/points` | ✓ | 포인트 요약 + 내역 |
| POST | `/api/points/spend` | ✓ | 포인트 사용 |
| WS | `/ws/energy` | ✗ | 실시간 전력 데이터 (WebSocket) |

---

## 실행 가이드

### 사전 요구사항
- Java 17 (Android Studio 내장 JDK 사용 가능)
- Node.js 18+
- Docker Desktop
- Android Studio + Android SDK
- Python 3.x (A파트 시뮬레이터용)

### 1단계: MySQL 실행

```bash
cd mysql/
docker-compose up -d
```

### 2단계: Spring Boot 실행

```bash
cd energy-api/
gradlew.bat bootRun        # Windows
# ./gradlew bootRun         # Mac/Linux
```

서버 시작 시 DataInitializer가 테스트 데이터를 자동 생성합니다.

### 3단계: React Native 실행

```bash
cd MyApp/
npm install
npx react-native start --reset-cache

# 새 터미널에서
npx react-native run-android
```

### 4단계: A파트 연동 (선택)

```bash
# A파트 Docker 인프라 실행 (Kafka + InfluxDB)
cd [A파트 경로]/
docker-compose up -d

# IoT 센서 시뮬레이터 실행
python ai-data-pipeline/virtual_esp32_sensor.py

# FastAPI 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 테스트 계정

| 항목 | 값 |
|------|-----|
| 이메일 | kim@energy.com |
| 비밀번호 | 1234 |
| 포인트 | 2,450P |
| 에코 레벨 | Lv.3 |

---

## A파트 연동 구조

| 연동 포인트 | A파트 (AI & Data Pipeline) | B파트 (Mobile & Backend) |
|------------|---------------------------|-------------------------|
| 데이터 수집 | Kafka `power-usage-topic` 발행 | Kafka Consumer로 구독 → MySQL 저장 |
| AI 예측 | LSTM 수요 예측 + ANFIS 미션 생성 | FastAPI 호출하여 미션 데이터 수신 |
| 시계열 DB | InfluxDB (raw 전력 데이터) | MySQL (비즈니스 데이터) |
| 인프라 | Docker: Kafka, InfluxDB, Kafka UI | Docker: MySQL |

---

## 개발 환경

- **OS**: Windows 11
- **IDE**: VS Code (React Native), IntelliJ IDEA (Spring Boot)
- **에뮬레이터**: Android Studio Pixel 9 Pro
- **프로젝트 경로**: `C:\dev\MyApp` (앱), `C:\dev\energy-api` (백엔드)
