package com.innotrader.market.adapter.out.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface MarketDailyTrendRepository extends JpaRepository<MarketDailyTrendJpaEntity, Long> {

    @Query("SELECT e FROM MarketDailyTrendJpaEntity e WHERE e.market = :market ORDER BY e.tradeDate DESC")
    List<MarketDailyTrendJpaEntity> findLatest(@Param("market") String market, Pageable pageable);

    @Query("SELECT e FROM MarketDailyTrendJpaEntity e WHERE e.market = :market AND e.tradeDate < :cursor ORDER BY e.tradeDate DESC")
    List<MarketDailyTrendJpaEntity> findBeforeCursor(@Param("market") String market, @Param("cursor") LocalDate cursor, Pageable pageable);
}
