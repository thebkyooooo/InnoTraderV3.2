package com.innotrader.quote.adapter.out;

import com.innotrader.quote.domain.port.out.FindStockBasePort;
import com.innotrader.stock.domain.port.out.LoadStockMasterPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class StockMasterQuoteAdapter implements FindStockBasePort {

    private final LoadStockMasterPort loadStockMasterPort;

    public StockMasterQuoteAdapter(LoadStockMasterPort loadStockMasterPort) {
        this.loadStockMasterPort = loadStockMasterPort;
    }

    @Override
    public Optional<StockBase> findBySymbol(String symbol) {
        return loadStockMasterPort.loadBySymbol(symbol)
                .map(s -> new StockBase(
                        s.name(), s.symbol(), s.market(),
                        s.price(), s.prevDiff(), s.change(),
                        s.volume(), s.lstdShrs(), s.marketCap()
                ));
    }
}
