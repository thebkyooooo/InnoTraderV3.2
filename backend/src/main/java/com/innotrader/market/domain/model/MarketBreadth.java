package com.innotrader.market.domain.model;

import java.util.List;

public record MarketBreadth(
        int upperLimit,
        int rising,
        int flat,
        int falling,
        int lowerLimit,
        List<StockBreadthItem> upperLimitStocks,
        List<StockBreadthItem> risingStocks,
        List<StockBreadthItem> flatStocks,
        List<StockBreadthItem> fallingStocks,
        List<StockBreadthItem> lowerLimitStocks
) {}
