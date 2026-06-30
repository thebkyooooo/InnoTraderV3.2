package com.innotrader.market.adapter.out.persistence;

import com.innotrader.market.domain.model.DailyTrend;
import com.innotrader.market.domain.port.in.GetMarketUseCase.MarketType;
import com.innotrader.market.domain.port.out.FindDailyTrendPort;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class MarketDailyTrendAdapter implements FindDailyTrendPort {

    private final MarketDailyTrendRepository repository;

    public MarketDailyTrendAdapter(MarketDailyTrendRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<DailyTrend> findByMarket(MarketType market, int size, LocalDate cursor) {
        String marketStr = switch (market) {
            case KOSPI  -> "KOSPI";
            case KOSDAQ -> "KOSDAQ";
            case ALL    -> "ALL";
        };
        PageRequest pageable = PageRequest.of(0, size);
        List<MarketDailyTrendJpaEntity> entities = cursor != null
                ? repository.findBeforeCursor(marketStr, cursor, pageable)
                : repository.findLatest(marketStr, pageable);
        return entities.stream().map(MarketDailyTrendJpaEntity::toDomain).toList();
    }
}
