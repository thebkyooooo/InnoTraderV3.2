package com.innotrader.quote.domain.port.out;

import java.util.Optional;

public interface FindStockBasePort {

    Optional<StockBase> findBySymbol(String symbol);

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
}
