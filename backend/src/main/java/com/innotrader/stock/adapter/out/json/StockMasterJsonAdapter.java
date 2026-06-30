package com.innotrader.stock.adapter.out.json;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.innotrader.common.support.PriceTick;
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
        // 기본 데이터를 호가 단위로 정렬해 인메모리에 적재 → master/quotes/chart 전 API가 동일 기준 sync.
        // 현재가·전일종가를 모두 틱 그리드에 맞추고 전일대비/등락률을 거기에 맞춰 재계산.
        this.stocks = records.stream()
                .map(r -> {
                    long price     = PriceTick.round(r.price());
                    long prevClose = PriceTick.round(r.price() - r.prevDiff());
                    long prevDiff  = price - prevClose;
                    double change  = prevClose == 0 ? 0.0
                            : Math.round(prevDiff * 1000.0 / prevClose) / 10.0;
                    return new StockMaster(
                            r.market(), r.rank(), r.name(), r.symbol(),
                            price, prevDiff, change,
                            r.volume(), r.lstdShrs(), r.marketCap());
                })
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
