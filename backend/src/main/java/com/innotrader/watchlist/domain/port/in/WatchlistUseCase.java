package com.innotrader.watchlist.domain.port.in;

import com.innotrader.watchlist.domain.model.WatchlistGroup;

import java.util.List;
import java.util.UUID;

/**
 * Inbound port: 관심그룹/관심종목 관리 유스케이스.
 *
 * <p>사용자ID는 인증 주체(JWT)에서 전달되며 명령에 포함된다.
 */
public interface WatchlistUseCase {

    record CreateGroupCommand(UUID userId, String groupName) {}
    record RenameGroupCommand(UUID userId, String groupCode, String groupName) {}
    record DeleteGroupCommand(UUID userId, String groupCode) {}
    record ItemsCommand(UUID userId, String groupCode, List<String> symbols) {}

    /** 관심그룹 조회 */
    List<WatchlistGroup> listGroups(UUID userId);

    /** 관심그룹 등록 (그룹코드 자동생성) → 갱신된 전체 그룹 목록 */
    List<WatchlistGroup> createGroup(CreateGroupCommand command);

    /** 관심그룹 변경(그룹명) → 갱신된 전체 그룹 목록 */
    List<WatchlistGroup> renameGroup(RenameGroupCommand command);

    /** 관심그룹 삭제 → 갱신된 전체 그룹 목록 */
    List<WatchlistGroup> deleteGroup(DeleteGroupCommand command);

    /** 관심종목 조회 (단일 그룹) */
    WatchlistGroup getGroup(UUID userId, String groupCode);

    /** 관심종목 추가 (복수) → 갱신된 그룹 */
    WatchlistGroup addItems(ItemsCommand command);

    /** 관심종목 삭제 (복수) → 갱신된 그룹 */
    WatchlistGroup removeItems(ItemsCommand command);

    /**
     * 기본 관심그룹으로 초기화 (기존 그룹 전체 삭제 후 재생성 → 코드 001/002/003 보장).
     * <ul>
     *   <li>관심그룹01 (001) : 코스피 시가총액 상위 100</li>
     *   <li>관심그룹02 (002) : 코스닥 시가총액 상위 100</li>
     *   <li>관심그룹03 (003) : 코스피 25 + 코스닥 25 (랜덤, 결정적)</li>
     * </ul>
     */
    void seedDefaults(UUID userId);
}
