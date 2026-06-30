package com.innotrader.market.domain.model;

import java.time.LocalDate;

public record DailyTrend(
        LocalDate tradeDate,
        long      closingPrice,
        long      prevDiff,
        double    changeRate,
        long      volume,
        long      foreignNet,
        long      individualNet,
        long      institutionNet
) {}
