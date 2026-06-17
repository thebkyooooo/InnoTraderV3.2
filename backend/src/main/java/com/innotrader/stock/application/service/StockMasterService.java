package com.innotrader.stock.application.service;

import com.innotrader.common.annotation.UseCase;
import com.innotrader.stock.domain.model.StockMaster;
import com.innotrader.stock.domain.port.in.GetStockMasterUseCase;
import com.innotrader.stock.domain.port.out.LoadStockMasterPort;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@UseCase
public class StockMasterService implements GetStockMasterUseCase {

    private final LoadStockMasterPort loadStockMasterPort;

    public StockMasterService(LoadStockMasterPort loadStockMasterPort) {
        this.loadStockMasterPort = loadStockMasterPort;
    }

    @Override
    public List<StockMaster> getByMarket(String market) {
        List<StockMaster> all = loadStockMasterPort.loadAll();
        if (market == null || market.isBlank() || "ALL".equalsIgnoreCase(market)) {
            return all;
        }
        return all.stream()
                .filter(s -> s.market().equalsIgnoreCase(market))
                .toList();
    }

    @Override
    public Optional<StockMaster> getBySymbol(String symbol) {
        return loadStockMasterPort.loadBySymbol(symbol);
    }

    @Override
    public List<StockMaster> getBySymbols(List<String> symbols) {
        Set<String> symbolSet = new HashSet<>(symbols);
        return loadStockMasterPort.loadAll().stream()
                .filter(s -> symbolSet.contains(s.symbol()))
                .toList();
    }
}
