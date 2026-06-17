package com.innotrader.stock.domain.port.in;

import com.innotrader.stock.domain.model.StockMaster;

import java.util.List;
import java.util.Optional;

/**
 * Inbound port: 종목마스터 조회 유스케이스.
 */
public interface GetStockMasterUseCase {

    /** 시장별 전체 종목 요약 목록 (market = ALL | KOSPI | KOSDAQ) */
    List<StockMaster> getByMarket(String market);

    /** 단일 종목 상세 */
    Optional<StockMaster> getBySymbol(String symbol);

    /** 복수 종목 상세 */
    List<StockMaster> getBySymbols(List<String> symbols);
}
