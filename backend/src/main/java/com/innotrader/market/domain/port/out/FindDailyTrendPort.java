package com.innotrader.market.domain.port.out;

import com.innotrader.market.domain.model.DailyTrend;
import com.innotrader.market.domain.port.in.GetMarketUseCase.MarketType;

import java.time.LocalDate;
import java.util.List;

public interface FindDailyTrendPort {
    List<DailyTrend> findByMarket(MarketType market, int size, LocalDate cursor);
}
