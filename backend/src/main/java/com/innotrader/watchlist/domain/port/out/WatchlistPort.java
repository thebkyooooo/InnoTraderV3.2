package com.innotrader.watchlist.domain.port.out;

import com.innotrader.watchlist.domain.model.WatchlistGroup;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Outbound port: 관심그룹/관심종목 영속성.
 */
public interface WatchlistPort {

    /** 사용자의 전체 관심그룹(종목 포함) 조회 */
    List<WatchlistGroup> findAllGroups(UUID userId);

    /** 사용자의 단일 관심그룹(종목 포함) 조회 */
    Optional<WatchlistGroup> findGroup(UUID userId, String groupCode);

    /** 그룹 + 종목 저장(upsert). 종목은 도메인 상태로 전체 교체된다. */
    WatchlistGroup save(WatchlistGroup group);

    /** 그룹 + 종목 삭제 */
    void delete(WatchlistGroup group);
}
