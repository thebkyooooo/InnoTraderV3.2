package com.innotrader.market.domain.model;

public record StockBreadthItem(
        String symbol,
        String name,
        long   price,
        long   prevDiff,
        double change
) {}
