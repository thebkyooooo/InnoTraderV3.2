<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# .claude

## Purpose
Claude Code IDE 설정 디렉토리입니다. OMC(oh-my-claudecode) 플러그인 활성화, 프로젝트 지시사항(CLAUDE.md), 커스텀 스킬이 여기에 위치합니다.

## Key Files
| File | Description |
|------|-------------|
| `CLAUDE.md` | 프로젝트 전용 AI 지시사항 및 OMC 오케스트레이션 가이드 |
| `settings.json` | Claude Code 플러그인 설정 (`oh-my-claudecode@omc` 활성화) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `skills/` | 프로젝트 전용 커스텀 스킬 (see `skills/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `CLAUDE.md`는 모든 세션에 자동 로드됨 — 모든 AI 지시사항 변경은 이 파일을 통해 관리
- `settings.json`은 JSON 형식이어야 하며 플러그인 이름은 정확히 일치해야 함
- 플러그인 설정 변경 후 Claude Code 재시작 필요

### Testing Requirements
- `settings.json` 수정 후 JSON 유효성 확인
- CLAUDE.md 변경 시 `<!-- OMC:START -->`와 `<!-- OMC:VERSION:x.x.x -->` 마커 유지

### Common Patterns
- 새 커스텀 스킬 추가: `skills/<skill-name>/SKILL.md` 파일 생성

## Dependencies

### External
- `oh-my-claudecode` npm 패키지 (플러그인 제공자)

<!-- MANUAL: -->
