package com.innotrader.watchlist.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link WatchlistItemJpaEntity}.
 */
public interface WatchlistItemJpaRepository extends JpaRepository<WatchlistItemJpaEntity, UUID> {

    List<WatchlistItemJpaEntity> findByGroupIdOrderByCreatedAtAsc(UUID groupId);

    /**
     * 그룹의 모든 종목 일괄 삭제 (벌크 DELETE).
     *
     * <p>{@code flushAutomatically}로 선행 변경을 먼저 반영하고, {@code clearAutomatically}로
     * 영속성 컨텍스트를 비워 이후 동일 (group_id, symbol) 재삽입 시 unique 충돌을 방지한다.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from WatchlistItemJpaEntity i where i.groupId = :groupId")
    void deleteByGroupId(@Param("groupId") UUID groupId);
}
