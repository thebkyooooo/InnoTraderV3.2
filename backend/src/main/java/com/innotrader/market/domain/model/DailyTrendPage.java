package com.innotrader.market.domain.model;

import java.time.LocalDate;
import java.util.List;

public record DailyTrendPage(
        List<DailyTrend> items,
        LocalDate        nextCursor
) {}
