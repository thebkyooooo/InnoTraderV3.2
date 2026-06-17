<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# omc-reference

## Purpose
OMC(oh-my-claudecode) 에이전트 카탈로그, 도구 참조, 팀 파이프라인, 커밋 프로토콜, 스킬 레지스트리를 담은 참조 스킬입니다. 에이전트 위임, OMC 도구 사용, 팀 오케스트레이션, 커밋, 스킬 호출 시 자동 로드됩니다.

## Key Files
| File | Description |
|------|-------------|
| `SKILL.md` | 스킬 본문 — 에이전트 카탈로그, 모델 라우팅, 도구 참조, 팀 파이프라인, 커밋 프로토콜 전체 내용 |

## For AI Agents

### Working In This Directory
- `SKILL.md`는 `user-invocable: false` — 자동 트리거 전용이며 사용자가 직접 호출 불가
- 에이전트 카탈로그 변경 시 플러그인 업데이트(`/oh-my-claudecode:omc-setup`)를 통해 갱신
- 이 스킬의 내용을 직접 수정하면 플러그인 업데이트 시 덮어써질 수 있음

### Common Patterns
자동 로드 조건:
- 에이전트 위임 직전
- OMC 도구(`TeamCreate`, `TaskCreate` 등) 사용 시
- `/team` 오케스트레이션 시
- 커밋 생성 시

## Dependencies

### Internal
- `../AGENTS.md` — 상위 skills 디렉토리

<!-- MANUAL: -->
