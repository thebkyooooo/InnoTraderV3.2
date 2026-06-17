package com.innotrader.market.domain.model;

public record IndexInfo(
        String code,      // KS11, KQ11, DJI, COMP, INX, N225, 000001, HSI
        String name,      // 코스피, 코스닥, ...
        double price,
        double prevDiff,
        double change
) {}
