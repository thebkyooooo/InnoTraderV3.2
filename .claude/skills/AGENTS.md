<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# skills

## Purpose
프로젝트 전용 커스텀 OMC 스킬 디렉토리입니다. 각 서브디렉토리가 하나의 스킬을 나타내며, `/oh-my-claudecode:<skill-name>` 형식으로 호출됩니다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `omc-reference/` | OMC 에이전트 카탈로그, 도구 참조, 팀 파이프라인 라우팅 레퍼런스 (see `omc-reference/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 새 스킬 추가 시 `<skill-name>/SKILL.md` 파일 생성
- SKILL.md 첫 줄에 YAML frontmatter(`name`, `description`, `user-invocable`) 포함 필수
- `user-invocable: false` 스킬은 자동 트리거 전용으로, 사용자가 직접 호출 불가

### Common Patterns
```yaml
---
name: skill-name
description: 스킬 설명 (자동 로드 트리거 조건 포함)
user-invocable: true|false
---
```

<!-- MANUAL: -->
