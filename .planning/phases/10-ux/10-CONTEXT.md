# Phase 10: 향상된 UX — 시각/인터랙션 완성 - Context

**수집일:** 2026-03-31
**상태:** 플래닝 준비 완료

<domain>
## Phase Boundary

배포 전 시각/인터랙션 경험 완성 — 실제 카드 이미지 교체, 카드 배분 애니메이션, 카드 뒤집기 인터랙션, 셔플/기리 UX 고도화, 패널 레이아웃 재설계, 베팅 강조.

**포함하지 않는 것:** 채팅 기능 실제 구현, 게임 이력, 학교 대신 가주기, 뒤늦게 입장, 세션 종료 처리, 올인 POT → 모두 Phase 11로 이동.

채팅 패널은 레이아웃 공간만 예약 (placeholder 유지).

</domain>

<phase_split_decision>
## 페이즈 분할 결정

Phase 10 범위가 15개 항목으로 과대하여 분할 결정:

- **Phase 10 (이 페이즈):** 모든 시각/UX 항목 — 이미지, 애니메이션, 셔플/기리, 패널 레이아웃, 베팅 강조
- **Phase 11 (신규 추가):** 소셜/기능 항목 — 채팅, 게임 이력, 학교 대신 가주기, 뒤늦게 입장, 세션종료 표시, 올인 POT
- **Phase 12 (기존 Phase 11):** 통합 테스트 + 배포

**⚠️ ROADMAP.md 업데이트 필요:** Phase 11(신규) 삽입, 기존 Phase 11(통합 테스트)은 Phase 12로 번호 변경. REQUIREMENTS.md Progress 파트 포함 전체 수정. 플래닝 에이전트가 첫 번째 태스크로 처리할 것.

</phase_split_decision>

<decisions>
## 구현 결정사항

### 카드 이미지 적용
- **D-01:** 실제 카드 이미지 파일 사용 — `img/01-1.png` ~ `img/10-2.png` (총 20장), `img/card_back.jpg`
- **D-02:** 테이블 배경 `img/background.jpg`, 메인 타이틀 `img/main_tilte.jpg` 적용
- **D-03:** 재경기 시 `img/regame.png` 투명도 오버레이 (기존 ResultScreen 위)

### 카드 배분 인터랙션
- **D-04:** 손패에 미리 카드가 뜨는 버그 → **클라이언트 숨김 방식**으로 해결. dealing phase 동안 카드 데이터를 받아도 뒷면으로만 표시. 서버 로직 무변경.
- **D-05:** 카드 배분 애니메이션 — 중앙 덱 위치에서 각 플레이어 손패 위치로 카드가 **날아오는 방식**. 반시계 방향 배분 순서대로 순차 실행.
- **D-06:** 배분 애니메이션 완료 후 모든 카드가 뒷면 상태로 도착 → 이후 사용자가 직접 뒤집기.

### 카드 뒤집기 인터랙션
- **D-07:** 내 카드 뒤집기 — **카드별 개별 클릭(탭)**으로 3D flip 애니메이션 후 앞면 공개. 2장 모두 뒤집으면 "확인 완료" 처리 (기존 확인 버튼 대체, UX-05).
- **D-08:** 3D flip은 CSS `transform: rotateY(180deg)` + `backface-visibility: hidden` 방식. sutda-shuffle-giri-ux.md의 포인터 이벤트 패턴 참고.
- **D-09:** 2장 중 1장씩 개별 뒤집기 가능. 1장 뒤집어도 족보 미표시, 2장 모두 뒤집으면 족보 자동 계산 표시.

### 셔플 인터랙션
- **D-10:** sutda-shuffle-giri-ux.md Section 1 전체 구현. `pointerdown` → 셔플 애니메이션 루프, `pointerup/pointerleave` → 즉시 종료.
- **D-11:** 애니메이션 방식: **requestAnimationFrame 기반 JS 애니메이션** (CSS keyframe 아님). peek→hold→rise→drop→rest 5 페이즈 (1사이클 ≈ 820ms).
- **D-12:** Zustand `ShuffleState` — `isShuffling`, `phase: ShufflePhase`, `pickedIdx` 관리.

### 기리(Cut) 인터랙션
- **D-13:** sutda-shuffle-giri-ux.md Section 2 전체 구현. 드래그(threshold 8px)로 더미 분리, 탭으로 합치기 순서 지정, 합치기 완료 버튼.
- **D-14:** 페이즈: `split → tap → merging → done`. Zustand `GiriState` — `phase: GiriPhase`, `piles: Pile[]`, `tapOrder: number[]`.
- **D-15:** 탭 순서 = 아래부터 위 순서 (1번 탭 = 맨 아래). 합치기 애니메이션 easeInOut 380ms.

### 패널 레이아웃 재설계
- **D-16:** **데스크탑 (md 이상) — 3열 레이아웃:**
  - 좌사이드: 베팅패널 + 손패패널 (수직 스택)
  - 중앙: 게임테이블패널 (메인, 최대 너비)
  - 우사이드: 정보패널 + 채팅패널 placeholder (수직 스택)
- **D-17:** **모바일 세로 — 수직 레이아웃:**
  - 상단: 게임테이블패널 + 정보패널 (레이어 배치 — 서로 요소 가리지 않게 배치)
  - 중단: 베팅패널 + 손패패널
  - 하단: 채팅패널 placeholder
- **D-18:** **스크롤 없는 단일 화면 필수.** 각 패널 내부 요소도 공간 효율적으로 설계. 고정 높이 or `vh` 단위 활용.
- **D-19:** Phase 6 D-08(원형 배치 CSS custom properties) 유지. 원형 레이아웃은 중앙 패널 안에서 동작.
- **D-20:** 채팅 패널은 Phase 11 구현 예정 — Phase 10에서는 공간만 예약 (placeholder, 빈 영역).

### 베팅 강조
- **D-21:** 내 베팅 차례일 때 베팅패널에 시각적 강조 표시 (BET-HIGHLIGHT). 구체적 스타일은 Claude's Discretion — 기존 shadcn/ui 테마와 어울리는 방식.

</decisions>

<phase11_scope>
## Phase 11 범위 (신규) — 소셜/기능 항목

다음 항목들은 Phase 11에서 구현:

### 채팅 (UX-02)
- 텍스트 채팅 기능 실제 구현 (Phase 10에서는 placeholder만)

### 게임 이력 (HIST-01/02)
- 상세 내용은 Phase 11 discuss-phase에서 확정

### 학교 대신 가주기
- **트리거:** 결과 화면 동안만 버튼 노출 (승자에게만)
- **대신 내주는 것:** 다음 판 엔티 1회만
- **UI:** 결과 화면에서 다른 플레이어 각각 옆에 [학교 대신 가주기] 버튼
- **피드백:** 대상 플레이어들에게 "[닉네임]님이 학교를 대신 가줬습니다" 토스트

### 뒤늦게 입장 (Observer)
- 게임 중 입장 시 Observer 모드로 진행 관람
- 판 교체 시 자동으로 일반 플레이어로 합류 (잠시쉬기 복귀 예약과 동일 로직)

### 세션 종료 표시
- 플레이어 연결 끊김 시: 해당 시트 제거 + 자리 재배치 + "[닉네임] 연결이 끊어졌습니다" 토스트
- **2인 게임 중 1명 퇴장 시:** 남은 1명은 방장 대기 화면으로 전환 (게임 속행 불가)

### 올인 POT (ALLIN-POT)
- 올인 승리 시 자신의 잔액총액만큼만 각 플레이어에게서 수령, 차액은 원래 플레이어에게 반환
- 올인 상태에서는 베팅 패널 비활성화, 나머지 플레이어는 베팅 계속

</phase11_scope>

<canonical_refs>
## Canonical References

- `sutda-shuffle-giri-ux.md` — 셔플/기리 인터랙션 전체 스펙 (가장 중요한 참고 문서)
- `img/` — 카드 이미지 디렉토리 (01-1.png ~ 10-2.png, card_back.jpg, background.jpg, main_tilte.jpg, regame.png)
- `.planning/phases/06-ui/06-CONTEXT.md` — 기존 패널 구성 결정 (D-08~D-11)
- `.planning/ROADMAP.md` — Phase 10/11/12 번호 변경 필요 (플래닝 에이전트 첫 태스크)

</canonical_refs>

<deferred>
## 다음 페이즈로 미룬 항목

다음은 Phase 11에서 구현:
- 텍스트 채팅 (UX-02)
- 게임 이력 (HIST-01/02)
- 학교 대신 가주기
- 뒤늦게 입장 (Observer)
- 세션 종료 표시
- 올인 POT (ALLIN-POT)

</deferred>
