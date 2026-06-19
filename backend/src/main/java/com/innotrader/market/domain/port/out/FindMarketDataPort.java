package com.innotrader.market.domain.port.out;

import java.util.List;

public interface FindMarketDataPort {

    record StockData(
            String symbol,
            String name,
            String market,       // KOSPI, KOSDAQ
            long   price,
            long   prevDiff,
            double change,
            long   volume,
            long   tradingAmount,
            long   marketCap
    ) {}

    List<StockData> findAll();
}
