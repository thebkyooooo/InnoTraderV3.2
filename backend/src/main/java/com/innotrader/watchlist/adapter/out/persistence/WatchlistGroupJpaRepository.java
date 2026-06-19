package com.innotrader.watchlist.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link WatchlistGroupJpaEntity}.
 */
public interface WatchlistGroupJpaRepository extends JpaRepository<WatchlistGroupJpaEntity, UUID> {

    List<WatchlistGroupJpaEntity> findByUserIdOrderByGroupCodeAsc(UUID userId);

    Optional<WatchlistGroupJpaEntity> findByUserIdAndGroupCode(UUID userId, String groupCode);
}
