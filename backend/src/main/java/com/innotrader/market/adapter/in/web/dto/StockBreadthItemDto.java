package com.innotrader.market.adapter.in.web.dto;

import com.innotrader.market.domain.model.StockBreadthItem;

public record StockBreadthItemDto(
        String symbol,
        String name,
        long   price,
        long   prevDiff,
        double change
) {
    public static StockBreadthItemDto from(StockBreadthItem i) {
        return new StockBreadthItemDto(i.symbol(), i.name(), i.price(), i.prevDiff(), i.change());
    }
}
