# Brainmind Harness

이 문서는 `뇌와 마음사이` 콘텐츠 프로덕션 시스템을 자가 검증 가능한 하네스로 운영하기 위한 계약이다. 구현 계약은 `src/data/harness-contract.json`에 있고, `npm run check:harness`가 이 문서의 핵심 조건을 기계적으로 검증한다.

## 선택한 프레임워크

상위 프레임워크는 Deep Agents다. 이유는 이 프로젝트가 단일 에이전트 호출이 아니라 파일 기반 장기 작업, 다중 에이전트 위임, 사람 승인 게이트, 지속 메모리, 온디맨드 스킬 로딩을 필요로 하기 때문이다.

구성 원칙:

- `TodoListMiddleware`: 각 실행 세션은 단계별 체크리스트를 남긴다.
- `FilesystemMiddleware`: 루트 워크스페이스를 기준으로 읽고, 에이전트별 쓰기 경계를 지킨다.
- `SubAgentMiddleware`: MUSE, LEO, NOVA, AXON, QUALITAS, PULSE를 역할별 작업자로 취급한다.
- `MemoryMiddleware`: `/memories/`에는 채널 보이스, 디자인 결정, 품질 발견, 발행 이력을 누적한다.
- `HumanInTheLoopMiddleware`: G1-G5 게이트에서 사람 승인을 요구한다.

## 에이전트 경계

| Agent | 역할 | 주요 쓰기 경계 |
|---|---|---|
| MUSE | 아이디어, 근거, RN, 아티클 | `cortex/`, `뇌와마음사이/*/02_research/`, `뇌와마음사이/*/04_article/` |
| LEO | 이미지, 인포그래픽, 썸네일 | `leo/`, `뇌와마음사이/*/03_image/` |
| NOVA | 홈페이지, 디자인 시스템, 발행 | `nova/`, `nova/homepage/` |
| AXON | 대본, TTS, 렌더링, 업로드 패키징 | `axon/`, `05_audio/`, `06_video/`, `07_shorts/` |
| QUALITAS | 품질 평가, 개선 태스크 | `qualitas/`, `docs/qualitas/`, `docs/roadmap/tasks/` |
| PULSE | 상태, 성과, 병목, 로드맵 | `pulse/`, `docs/pulse/`, `docs/roadmap/` |

다른 시스템의 폴더는 읽기 전용이다. 경계를 넘는 변경은 사람 승인 또는 별도 핸드오프 문서가 필요하다.

## 상태 기계

표준 상태는 다음 순서로 흐른다.

`idea -> researching -> research_complete -> article_draft -> article_review -> article_complete -> images_ready -> published -> sent_to_axon -> video_draft -> video_review -> video_complete`

홈페이지는 `scripts/sync-project-state.mjs`로 현재 토픽 상태를 스캔해 `src/data/project-status.json`을 갱신한다. 상태명이 계약 밖으로 벗어나면 `npm run check:harness`가 실패한다.

## 사람 게이트

| Gate | 시점 | 승인 조건 |
|---|---|---|
| G1 | 아이디어에서 RN 후보로 이동 | 5개 통과 질문, 주제 폴더 또는 RN 후보 |
| G2 | RN에서 아티클 정제로 이동 | 피어리뷰 논문 2편 이상, 일관성 체크리스트 |
| G3 | 아티클에서 NOVA 발행 큐로 이동 | 글쓰기 원칙, 이미지 슬롯, 발행 메타데이터 |
| G4 | 홈페이지 프로덕션 발행 | `npm run verify`, 브라우저 스모크 테스트, 배포 전 확인 |
| G5 | 영상 업로드 | 영상 검수, 썸네일/제목/설명, QUALITAS 평가 |

## 자가 검증 루프

1. `npm run sync:status`: 루트 워크스페이스에서 콘텐츠·시스템 상태를 다시 스캔한다.
2. `npm run build`: Astro 정적 사이트를 생성한다.
3. `node scripts/check-blog-integrity.mjs`: 블로그 생성 결과와 라우팅을 확인한다.
4. `npm run check:project`: 프로젝트 상태 데이터 구조를 검증한다.
5. `npm run check:a11y`: 접근성·링크·포커스·검색 계약을 검증한다.
6. `npm run check:harness`: 에이전트, 상태, 게이트, 메모리, 검증 명령 계약을 검증한다.

운영자는 발행 전 `npm run verify` 하나로 위 루프를 모두 실행한다.

## 발전 방식

하네스는 완성된 문서가 아니라 운영 중 계속 학습하는 계약이다. QUALITAS는 평가 결과를 개선 태스크로 만들고, PULSE는 병목을 로드맵으로 끌어올린다. NOVA는 대시보드에 최신 스냅샷을 보여주며, 새 상태나 새 게이트가 필요해지면 먼저 `harness-contract.json`을 수정하고 검사 실패를 확인한 뒤 구현을 맞춘다.
