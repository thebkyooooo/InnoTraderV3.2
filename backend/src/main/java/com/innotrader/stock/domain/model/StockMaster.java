package com.innotrader.stock.domain.model;

import com.innotrader.common.support.PriceTick;

/**
 * 종목마스터 도메인 모델.
 * stock-master.json 기반 인메모리 시세 데이터. 가격은 호가 단위(틱)로 정렬되어 적재된다.
 */
public record StockMaster(
        String market,
        int    rank,
        String name,
        String symbol,
        long   price,
        long   prevDiff,
        double change,
        long   volume,
        long   lstdShrs,
        long   marketCap
) {
    /** 전일 종가 */
    public long prevClose() { return price - prevDiff; }

    /** 시가 (전일종가 근사) */
    public long open() { return prevClose(); }

    /** 고가 (당일 고점 근사 = 상위 1%, 호가 단위 정렬) */
    public long high() { return PriceTick.round(Math.max(price, prevClose()) + Math.abs(price / 100)); }

    /** 저가 (당일 저점 근사 = 하위 1%, 호가 단위 정렬) */
    public long low() { return PriceTick.round(Math.min(price, prevClose()) - Math.abs(price / 100)); }

    /** 거래금액(만) */
    public long turnoverMan() { return volume * price / 10_000L; }
}
