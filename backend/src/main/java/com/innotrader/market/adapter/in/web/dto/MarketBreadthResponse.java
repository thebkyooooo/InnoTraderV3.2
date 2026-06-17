package com.innotrader.market.adapter.in.web.dto;

import com.innotrader.market.domain.model.MarketBreadth;

import java.util.List;

public record MarketBreadthResponse(
        int upperLimit,
        int rising,
        int flat,
        int falling,
        int lowerLimit,
        List<StockBreadthItemDto> upperLimitStocks,
        List<StockBreadthItemDto> risingStocks,
        List<StockBreadthItemDto> flatStocks,
        List<StockBreadthItemDto> fallingStocks,
        List<StockBreadthItemDto> lowerLimitStocks
) {
    public static MarketBreadthResponse from(MarketBreadth b) {
        return new MarketBreadthResponse(
                b.upperLimit(),
                b.rising(),
                b.flat(),
                b.falling(),
                b.lowerLimit(),
                b.upperLimitStocks().stream().map(StockBreadthItemDto::from).toList(),
                b.risingStocks().stream().map(StockBreadthItemDto::from).toList(),
                b.flatStocks().stream().map(StockBreadthItemDto::from).toList(),
                b.fallingStocks().stream().map(StockBreadthItemDto::from).toList(),
                b.lowerLimitStocks().stream().map(StockBreadthItemDto::from).toList()
        );
    }
}
