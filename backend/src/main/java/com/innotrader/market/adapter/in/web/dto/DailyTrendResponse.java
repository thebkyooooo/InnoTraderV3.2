package com.innotrader.market.adapter.in.web.dto;

import com.innotrader.market.domain.model.DailyTrend;

import java.time.LocalDate;

public record DailyTrendResponse(
        LocalDate tradeDate,
        long      closingPrice,
        long      prevDiff,
        double    changeRate,
        long      volume,
        long      foreignNet,
        long      individualNet,
        long      institutionNet
) {
    public static DailyTrendResponse from(DailyTrend d) {
        return new DailyTrendResponse(
                d.tradeDate(), d.closingPrice(), d.prevDiff(), d.changeRate(),
                d.volume(), d.foreignNet(), d.individualNet(), d.institutionNet()
        );
    }
}
