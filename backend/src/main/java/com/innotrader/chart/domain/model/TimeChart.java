package com.innotrader.chart.domain.model;

/** 분별 차트 시세 (1분/5분/10분/30분/60분). */
public record TimeChart(
        String date,          // yyyyMMdd (거래일)
        String time,          // HHmmss
        long   price,         // 체결가
        long   prevDiff,      // 전일대비
        double change,        // 등락률(%)
        long   open,          // 시가
        long   high,          // 고가
        long   low,           // 저가
        long   filledVolume,  // 체결량
        long   volume         // 거래량(누적)
) {}
