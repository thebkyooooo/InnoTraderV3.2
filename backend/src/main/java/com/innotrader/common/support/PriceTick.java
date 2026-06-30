package com.innotrader.common.support;

/**
 * KRX 가격대별 호가 단위(틱) 유틸. (2023 개정 — KOSPI/KOSDAQ 통일 기준)
 *
 * <ul>
 *   <li>2,000원 미만           : 1</li>
 *   <li>2,000 ~ 5,000 미만     : 5</li>
 *   <li>5,000 ~ 20,000 미만    : 10</li>
 *   <li>20,000 ~ 50,000 미만   : 50</li>
 *   <li>50,000 ~ 200,000 미만  : 100</li>
 *   <li>200,000 ~ 500,000 미만 : 500</li>
 *   <li>500,000 이상           : 1,000</li>
 * </ul>
 */
public final class PriceTick {

    private PriceTick() {}

    /** 가격대별 호가 단위. */
    public static long tickSize(long price) {
        if (price < 2_000)    return 1;
        if (price < 5_000)    return 5;
        if (price < 20_000)   return 10;
        if (price < 50_000)   return 50;
        if (price < 200_000)  return 100;
        if (price < 500_000)  return 500;
        return 1_000;
    }

    /** 가격을 해당 호가 단위 그리드로 반올림. */
    public static long round(long price) {
        long t = tickSize(price);
        return Math.max(t, Math.round((double) price / t) * t);
    }
}
