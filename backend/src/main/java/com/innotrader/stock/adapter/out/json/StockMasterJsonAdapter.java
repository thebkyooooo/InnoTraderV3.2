package com.innotrader.stock.adapter.out.json;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.innotrader.stock.domain.model.StockMaster;
import com.innotrader.stock.domain.port.out.LoadStockMasterPort;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class StockMasterJsonAdapter implements LoadStockMasterPort {

    private final List<StockMaster> stocks;
    private final Map<String, StockMaster> symbolIndex;

    public StockMasterJsonAdapter(ObjectMapper objectMapper) throws IOException {
        ClassPathResource resource = new ClassPathResource("stock-master.json");
        List<StockMasterRecord> records = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<>() {}
        );
        this.stocks = records.stream()
                .map(r -> new StockMaster(
                        r.market(), r.rank(), r.name(), r.symbol(),
                        r.price(), r.prevDiff(), r.change(),
                        r.volume(), r.lstdShrs(), r.marketCap()))
                .toList();
        this.symbolIndex = this.stocks.stream()
                .collect(Collectors.toMap(StockMaster::symbol, Function.identity()));
    }

    @Override
    public List<StockMaster> loadAll() {
        return stocks;
    }

    @Override
    public Optional<StockMaster> loadBySymbol(String symbol) {
        return Optional.ofNullable(symbolIndex.get(symbol));
    }
}
