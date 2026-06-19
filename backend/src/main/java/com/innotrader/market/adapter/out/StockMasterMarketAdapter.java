package com.innotrader.market.adapter.out;

import com.innotrader.common.annotation.PersistenceAdapter;
import com.innotrader.market.domain.port.out.FindMarketDataPort;
import com.innotrader.stock.domain.port.out.LoadStockMasterPort;

import java.util.List;

@PersistenceAdapter
public class StockMasterMarketAdapter implements FindMarketDataPort {

    private final LoadStockMasterPort loadStockMasterPort;

    public StockMasterMarketAdapter(LoadStockMasterPort loadStockMasterPort) {
        this.loadStockMasterPort = loadStockMasterPort;
    }

    @Override
    public List<StockData> findAll() {
        return loadStockMasterPort.loadAll().stream()
                .map(s -> new StockData(
                        s.symbol(),
                        s.name(),
                        s.market(),
                        s.price(),
                        s.prevDiff(),
                        s.change(),
                        s.volume(),
                        s.turnoverMan(),
                        s.marketCap()
                ))
                .toList();
    }
}
