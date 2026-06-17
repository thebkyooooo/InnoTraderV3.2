package com.innotrader.market.domain.model;

public record MarketTrend(
        long foreign,      // 외국인순매수(억)
        long individual,   // 개인순매수(억)
        long institution   // 기관순매수(억)
) {}
