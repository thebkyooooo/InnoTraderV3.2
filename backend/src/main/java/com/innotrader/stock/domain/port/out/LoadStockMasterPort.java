package com.innotrader.stock.domain.port.out;

import com.innotrader.stock.domain.model.StockMaster;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port: 종목마스터 데이터 로드.
 */
public interface LoadStockMasterPort {

    List<StockMaster> loadAll();

    Optional<StockMaster> loadBySymbol(String symbol);
}
