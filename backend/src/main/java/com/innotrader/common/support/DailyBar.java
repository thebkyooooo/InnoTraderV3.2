package com.innotrader.common.support;

/**
 * 일자별(일봉) 합성 시세의 단위 바.
 * 일별 시세 그리드 · 차트 일봉 · 투자동향이 공유하는 정합 데이터.
 */
public record DailyBar(
        String date,        // yyyyMMdd
        long   close,       // 종가
        long   prevDiff,    // 전일대비
        double change,      // 등락률(%)
        long   open,        // 시가
        long   high,        // 고가
        long   low,         // 저가
        long   volume,      // 거래량
        long   turnoverMan  // 거래금액(만)
) {}
