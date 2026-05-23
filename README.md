# 우리집 전기 저금통 - Backend Service & Client

# 현재 메인 홈 화면의 그래프 및 마이페이지 연동 작업 중입니다! 이벤트, 미션, 포인트 메뉴의 경우 실제 데이터를 받아서 할 경우 이용하기가 어려워 연동은 따로 안하고 있습니다.

본 레포지토리는 강원특별자치도 2040 탄소중립 실현을 위한 '에지-AI 융합 분산 아키텍처 기반 도민 참여형 수요반응(DR) 플랫폼'의 **백엔드 서비스(MSA)** 및 **사용자 클라이언트(Mobile App)** 계층입니다. A파트의 AI 코어가 산출한 예측 부하(LSTM)와 미션 난이도(ANFIS)를 도민이 직관적으로 인지할 수 있도록 시각화하고, JWT 인증·DR 이벤트 참여·미션 진행·포인트 정산 등 도메인 비즈니스 로직을 처리하는 End-to-End 서비스 레이어를 구현하였습니다.

## System Architecture & E2E Service Flow

```
[A파트 인프라 / AI Core]            [B파트 백엔드 (MSA)]                  [B파트 클라이언트]
 (Kafka / InfluxDB                   (Spring Boot 3.2.5 :8085)             (React Native 0.84)
  / FastAPI Inference :8000)          MySQL energydb

 ┌──────────────────────┐         ┌────────────────────────────┐         ┌────────────────────────┐
 │  Kafka Topic         │  Pull   │  KafkaConsumerService      │   WS    │  HomeScreen            │
 │  power-usage-topic   │ ──────▶ │   └─▶ MySQL EnergyData     │ ──────▶ │  (도넛/96슬롯 라인차트) │
 │  (96슬롯 페이로드)    │         │      EnergyWebSocketHandler│         │                        │
 └──────────────────────┘         └────────────────────────────┘         └────────────────────────┘
                                              ▲                                     ▲
 ┌──────────────────────┐                     │                                     │
 │  FastAPI ANFIS API   │ ─── REST 8000 ──────┤                                     │
 │  /api/v1/missions/   │                     │                                     │
 │     generate         │                     │                                     │
 └──────────────────────┘                     ▼                                     │
                                  ┌────────────────────────────┐                    │
                                  │  REST API (JWT Stateless)  │                    │
                                  │   /api/auth                │                    │
                                  │   /api/energy              │                    │
                                  │   /api/dr                  │ ◀──── REST 8085 ───┤
                                  │   /api/missions            │                    │
                                  │   /api/points              │                    │
                                  │   /api/profile             │                    │
                                  └────────────────────────────┘                    │
                                                                                    │
                                  ┌────────────────────────────┐                    │
                                  │  Mock 결제 API              │ ◀── 강원마트 QR ───┤
                                  │  (포인트 → 가맹점 트랜잭션) │                    │
                                  └────────────────────────────┘                    │
```

- **수신 (Ingestion)**: Spring Boot의 `KafkaConsumerService`가 A파트의 Kafka 토픽(`power-usage-topic`)을 Pull 방식으로 구독한다.
- **영속 (Persistence)**: 수신된 96슬롯(15분 단위) 데이터는 JPA 트랜잭션을 통해 MySQL의 `EnergyData` 엔티티에 적재된다.
- **중계 (Broadcasting)**: 동시에 `EnergyWebSocketHandler`가 인증된 모바일 클라이언트로 실시간 푸시한다.
- **표출 (Visualization)**: React Native 앱(`HomeScreen`)이 WebSocket으로 수신한 페이로드를 `react-native-svg` 도넛/라인 차트로 즉각 렌더링한다.
- **상호작용 (Interaction)**: 도민은 미션 수행/DR 참여를 통해 포인트를 적립하고, Mock 결제 API를 통해 강원 지역 가맹점에서 차감 사용한다.

## 아키텍처 고도화 및 트러블슈팅 (Key Refinements)

초기 기획에서 한 단계 전진하여, 사용자 경험과 데이터 정합성을 확보하기 위해 다음과 같이 아키텍처를 고도화하였습니다.

### Web Prototype → React Native CLI 전면 이행
- **변경 사항**: React 웹 프로토타입을 React Native 0.84 CLI 환경으로 전체 이관하고, 모든 차트를 `react-native-svg` 네이티브 컴포넌트로 재구현하였다.
- **문제**: Lovable의 웹 컴포넌트는 모바일 네이티브 환경에서 터치 제스처/스크롤 관성/SafeArea 처리가 불연속적이었고, DOM 기반 차트는 안드로이드 저사양 기기에서 프레임 드랍을 유발하였다.
- **해결**: `@react-navigation/bottom-tabs`와 `@react-navigation/native-stack`을 조합한 이중 네비게이션 구조로 재설계하고, SVG 렌더링은 RN 네이티브 브릿지로 직접 처리하도록 전환하였다.
- **타당성**: iOS/Android 양 플랫폼에서 단일 코드베이스로 안정적인 렌더링을 확보하고, 발표 시연 시 디바이스/에뮬레이터 환경 차이로 인한 시각적 결함을 제거하였다.

### H2 In-Memory DB → MySQL 8.0 영속 계층 전환
- **변경 사항**: 개발 초기 H2 인메모리 DB로 운용하던 영속 계층을 Docker MySQL 8.0 컨테이너로 이관하였다.
- **문제**: H2는 Spring Boot 종료 시 모든 사용자/포인트/미션 데이터가 소실되어, 매 재시작마다 `DataInitializer`가 테스트 데이터를 재생성하는 비효율이 발생하였다.
- **해결**: `application.yml`의 datasource를 `jdbc:mysql://localhost:3306/energydb`로 전환하고, JPA `ddl-auto: update` 정책으로 스키마 자동 마이그레이션을 활성화하였다.
- **타당성**: 데모 시연 도중 서버를 재시작해도 누적 사용량/포인트 잔액이 유지되어, 도민의 자발적 절감 행동 → 포인트 보상이라는 시간 축 시나리오를 끊김 없이 시연 가능하다.

### Zustand 기반 도메인 분리 상태 관리 (Domain-Driven Store)
- **변경 사항**: 단일 통합 store에 묶여있던 클라이언트 상태를 `useEnergyStore`, `useDRStore`, `useMissionStore`, `usePointStore`, `useProfileStore`, `useAuthStore`의 6개 도메인 스토어로 분리하였다.
- **문제**: 통합 스토어 구조에서는 한 화면의 상태 갱신이 무관한 화면의 리렌더링을 유발하여 저사양 안드로이드 기기에서 프레임 드랍이 관측되었다.
- **해결**: Zustand의 selector 패턴을 활용해 도메인별 상태를 격리하고, 컴포넌트가 구독하는 슬라이스만 리렌더링되도록 종속성을 정제하였다.
- **타당성**: 백엔드 API 도메인(인증·에너지·DR·미션·포인트·프로필)과 클라이언트 스토어 도메인이 1:1로 정합하여, 향후 API 확장 시 영향 범위가 명확히 한정된다.

### 96슬롯 WebSocket 데이터 규격 정합 (A파트 ↔ B파트 동기화)
- **변경 사항**: A파트가 다운샘플링한 15분 단위(96슬롯) 배열 규격을 그대로 수용하도록 `EnergyWebSocketHandler`와 클라이언트 `useWebSocket` 훅의 페이로드 스키마를 정렬하였다.
- **문제**: 초기 구현에서 백엔드와 모바일 앱이 서로 다른 시간 단위를 가정하여, 차트의 X축 인덱스와 데이터 길이가 어긋나는 결함이 발생하였다.
- **해결**: 공통 DTO(`AppDto`)에 `hourlyActual: number[96]` 필드를 정의하여 양 계층 모두 동일 인덱싱으로 처리하도록 강제하였다.
- **타당성**: SVG 차트의 `viewBox` 폭과 데이터 포인트 수가 정확히 일치하여 시간축 왜곡 없이 렌더링되며, A파트 Time-Warp 엔진의 "현실 1초 = 시뮬레이션 1분" 가정을 클라이언트까지 일관되게 전달한다.

### JWT Stateless 인증 + WebSocket 핸드셰이크 분리
- **변경 사항**: REST API는 `JwtAuthenticationFilter`로 토큰 기반 인가를 수행하되, WebSocket 연결은 별도 인증 경로를 두어 Spring Security 필터 체인에서 `/ws/**`를 분리하였다.
- **문제**: WebSocket 초기 핸드셰이크 요청은 표준 HTTP Authorization 헤더를 React Native 환경에서 안정적으로 부착하지 못하는 이슈가 있었다.
- **해결**: 핸드셰이크 시점에 query parameter로 토큰을 전달받아 `JwtUtil`로 검증한 뒤 세션을 수립하도록 변경하였다.
- **타당성**: HTTP REST 호출과 WebSocket 푸시 모두 동일한 JWT secret으로 인증되며, 도민의 세션이 양쪽 채널에서 일관되게 유지된다.

### Metro Bundler 포트 이중화 (8081 → 8082)
- **변경 사항**: React Native Metro Bundler의 기본 포트를 8081에서 8082로 변경하였다.
- **문제**: 기본 8081은 일부 환경에서 Spring Boot/Kafka 관리 도구 등과 충돌하여 빌드가 간헐적으로 실패하였다.
- **해결**: `--port 8082` 플래그를 `start-all.bat`과 빌드 명령 양쪽에 명시하여 포트 점유를 분리하였다.
- **타당성**: 한 머신에서 백엔드와 모바일 빌드 환경이 충돌 없이 공존하여, 발표 환경 셋업 시간을 단축한다.

## 시스템 구동 절차 (Execution Guide)

본 시스템은 A파트(데이터 파이프라인/AI)와 B파트(백엔드/클라이언트)가 분리된 멀티 레포 구조입니다. 의존성 충돌 및 포트 점유 문제를 방지하기 위해 아래의 순서를 정확히 지켜 실행합니다. 최상위 `start-all.bat`을 통해 일괄 기동도 가능합니다.

### Phase 1: A파트 인프라 컨테이너 기동
- 경로: `C:\dev\data_pipeline_ai-main\` (A파트 레포)
- 명령어: `docker-compose up -d`
- 역할: Kafka, Zookeeper, InfluxDB, MySQL 컨테이너 활성화
- 대기: 약 15초 (Kafka 브로커 준비)

### Phase 2: B파트 Spring Boot 백엔드 기동
- 경로: `C:\dev\energy-api\`
- 명령어: `gradlew.bat bootRun`
- 역할: Spring Boot 서버(:8085) 기동, `KafkaConsumerService`가 Kafka 토픽 구독 시작
- 검증: `http://localhost:8085/api/auth/login` 핑 응답 확인

### Phase 3: A파트 AI Serving 기동
- 경로: `C:\dev\data_pipeline_ai-main\ai-data-pipeline\`
- 명령어: `uvicorn api_serving.main:app --host 0.0.0.0 --port 8000`
- 역할: FastAPI 추론 서버 기동 (B파트가 ANFIS 미션 생성 요청 시 호출)

### Phase 4: 가상 ESP32 센서 가동
- 경로: `C:\dev\data_pipeline_ai-main\ai-data-pipeline\simulators\`
- 명령어: `python virtual_esp32_sensor.py`
- 역할: 1만 가구 가상 데이터를 10,000 TPS로 Kafka에 발사

### Phase 5: A파트 Ingestion Worker 기동
- 경로: `C:\dev\data_pipeline_ai-main\ai-data-pipeline\workers\`
- 명령어: `python ingestion_api.py`
- 역할: Kafka 1차 필터링/전처리 후 분산 저장소 라우팅

### Phase 6: React Native Metro Bundler 기동
- 경로: `C:\dev\MyApp\`
- 명령어: `npx react-native start --port 8082`
- 비고: 기본 포트 8081은 Spring Boot/관리 도구와 충돌 가능성이 있어 8082로 분리

### Phase 7: Android Emulator/Device 빌드
- 경로: `C:\dev\MyApp\`
- 명령어: `npx react-native run-android --port 8082`
- 사전 조건: Android Studio 에뮬레이터가 실행 중이어야 한다

### 일괄 실행 (권장)
모든 Phase를 순차적으로 자동화한 `start-all.bat` 사용:
```cmd
cd C:\dev
start-all.bat
```
종료는 `stop-all.bat`.

### 상태 확인 엔드포인트
- Spring Boot: `http://localhost:8085`
- FastAPI Swagger: `http://localhost:8000/docs`
- Kafka UI: `http://localhost:8090`
- Metro: `http://localhost:8082`

### 테스트 계정
- 이메일: `kim@energy.com` / 비밀번호: `1234`
- 위치: 강원도 원주시 / 3인 가구 / Lv.3 / 초기 2,650P

## Directory Structure

본 레포지토리는 모바일 클라이언트(MyApp), 백엔드 서비스(energy-api), 시연용 시뮬레이터(pipeline)를 명확히 분리하였습니다.

```
backend_service_client/
├── MyApp/                              # [React Native 모바일 클라이언트]
│   ├── App.js                          # 앱 진입점 (Auth Stack ↔ Main Tab 분기)
│   ├── index.js                        # React Native 부트스트래퍼
│   │
│   ├── api/                            # [백엔드 통신 계층]
│   │   ├── apiClient.js                # JWT 토큰 자동 부착 axios 클라이언트
│   │   └── useWebSocket.js             # 실시간 전력 데이터 수신 훅 (96슬롯)
│   │
│   ├── components/
│   │   └── Modals.js                   # 확인/토스트/QR 바텀시트 공용 컴포넌트
│   │
│   ├── screens/                        # [화면 라우트 계층]
│   │   ├── HomeScreen.js               # 실시간 도넛 + 96슬롯 시간대별 라인 차트
│   │   ├── DREventScreen.js            # DR 이벤트 참여/알림/이력 조회
│   │   ├── MissionScreen.js            # 카테고리별 미션 진행도 + 자동 포인트 적립
│   │   ├── PointScreen.js              # 포인트 적립/사용 내역 + QR 결제 바텀시트
│   │   ├── MyPageScreen.js             # 통계/에코 레벨/IoT 기기/설정/로그아웃
│   │   ├── LoginScreen.js              # JWT 로그인 + Shake 에러 애니메이션
│   │   ├── SignUpScreen.js             # 2단계 회원가입 (위치/가구 칩 선택)
│   │   └── SignUpCompleteScreen.js     # 가입 완료 스프링 애니메이션
│   │
│   ├── store/                          # [Zustand 도메인 스토어 계층]
│   │   ├── store.js                    # 에너지/DR/미션/포인트/프로필 통합 export
│   │   └── authStore.js                # 로그인 세션 및 JWT 토큰 관리
│   │
│   └── package.json                    # React Native 0.84.1, Zustand 5.x 의존성
│
├── energy-api/                         # [Spring Boot 백엔드 (MSA 도메인 서비스)]
│   ├── src/main/java/com/energy/api/
│   │   ├── EnergyApiApplication.java   # Spring Boot 진입점
│   │   │
│   │   ├── config/                     # [전역 설정 계층]
│   │   │   ├── SecurityConfig.java     # Spring Security + CORS + JWT 필터 체인
│   │   │   ├── JwtUtil.java            # JWT 토큰 생성/검증 유틸리티
│   │   │   ├── JwtAuthenticationFilter.java # 요청별 JWT 검증 필터
│   │   │   ├── WebSocketConfig.java    # WebSocket 핸들러 엔드포인트 등록
│   │   │   └── DataInitializer.java    # 서버 시작 시 테스트 데이터 자동 시드
│   │   │
│   │   ├── controller/                 # [REST API 엔드포인트 계층]
│   │   │   ├── AuthController.java     # 로그인/회원가입/토큰 발급
│   │   │   ├── EnergyController.java   # 실시간/누적 전력 사용량 조회
│   │   │   ├── DREventController.java  # DR 이벤트 CRUD/참여/알림
│   │   │   ├── MissionController.java  # 카테고리별 미션 조회/진행/완료
│   │   │   ├── PointController.java    # 포인트 적립/사용/잔액
│   │   │   └── ProfileController.java  # 프로필/통계/월간 리포트
│   │   │
│   │   ├── dto/                        # [요청/응답 DTO 계층]
│   │   │   ├── AuthDto.java            # 로그인/회원가입 페이로드
│   │   │   ├── AppDto.java             # 96슬롯 hourlyActual 등 공통 페이로드
│   │   │   └── ProfileDto.java         # 통계/레벨/리포트 페이로드
│   │   │
│   │   ├── entity/                     # [JPA 엔티티 계층]
│   │   │   ├── User.java               # 도민 사용자 + 에코 레벨
│   │   │   ├── EnergyData.java         # Kafka 수신 전력 데이터 영속체
│   │   │   ├── DREvent.java            # 수요반응 이벤트 마스터
│   │   │   ├── DRParticipation.java    # 사용자별 DR 참여 이력
│   │   │   ├── Mission.java            # ANFIS가 생성한 미션 마스터
│   │   │   ├── MissionProgress.java    # 사용자별 미션 진행도
│   │   │   └── PointHistory.java       # 포인트 적립/사용 트랜잭션 로그
│   │   │
│   │   ├── repository/                 # [Spring Data JPA 리포지토리 7종]
│   │   │   └── (엔티티별 1:1 매핑)
│   │   │
│   │   └── service/                    # [비즈니스 로직 계층]
│   │       ├── AuthService.java                # 인증/회원가입 로직
│   │       ├── EnergyService.java              # 전력 데이터 조회/집계
│   │       ├── KafkaConsumerService.java       # A파트 Kafka 토픽 구독 및 영속화
│   │       ├── EnergyWebSocketHandler.java     # 클라이언트 실시간 푸시 핸들러
│   │       ├── DREventService.java             # DR 이벤트 도메인 로직
│   │       ├── MissionService.java             # 미션 진행/완료/포인트 적립 트리거
│   │       ├── PointService.java               # 포인트 적립/사용/잔액 계산
│   │       └── ProfileService.java             # 통계/리포트 집계 로직
│   │
│   ├── src/main/resources/
│   │   └── application.yml             # MySQL/Kafka/JWT/포트 통합 설정
│   └── build.gradle                    # Spring Boot 3.2.5 의존성 명세
│
├── pipeline/
│   └── simulator/
│       └── iot_simulator.py            # 단독 시연용 MQTT 발행 시뮬레이터
│                                       # (A파트 인프라 없이도 단일 가구 시연 가능)
│
├── start-all.bat                       # 7단계 일괄 기동 스크립트
├── stop-all.bat                        # 전체 서비스 종료 스크립트
├── .gitignore                          # node_modules / build / A파트 폴더 제외
└── README.md                           # 현재 문서
```
