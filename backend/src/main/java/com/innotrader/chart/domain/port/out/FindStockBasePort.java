package com.innotrader.chart.domain.port.out;

import java.util.Optional;

public interface FindStockBasePort {

    record StockBase(
            String name,
            String symbol,
            String market,
            long   price,
            long   prevDiff,
            double change,
            long   volume,
            long   lstdShrs,
            long   marketCap
    ) {}

    Optional<StockBase> findBySymbol(String symbol);
}
