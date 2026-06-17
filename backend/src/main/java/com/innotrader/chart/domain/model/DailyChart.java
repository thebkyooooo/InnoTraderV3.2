package com.innotrader.chart.domain.model;

/** 일별 차트 시세 (일봉/주봉/월봉/년봉). */
public record DailyChart(
        String date,        // yyyyMMdd
        long   price,       // 종가
        long   prevDiff,    // 전일대비
        double change,      // 등락률(%)
        long   open,        // 시가
        long   high,        // 고가
        long   low,         // 저가
        long   volume,      // 거래량
        long   turnoverMan  // 거래금액(만)
) {}
