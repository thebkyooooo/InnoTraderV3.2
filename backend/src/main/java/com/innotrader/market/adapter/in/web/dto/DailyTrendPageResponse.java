package com.innotrader.market.adapter.in.web.dto;

import java.time.LocalDate;
import java.util.List;

public record DailyTrendPageResponse(
        List<DailyTrendResponse> items,
        LocalDate                nextCursor
) {}
