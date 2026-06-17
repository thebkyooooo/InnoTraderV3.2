package com.innotrader.market.domain.port.in;

import com.innotrader.market.domain.model.ExchangeRate;
import com.innotrader.market.domain.model.IndexInfo;
import com.innotrader.market.domain.model.MarketBreadth;
import com.innotrader.market.domain.model.MarketTrend;
import com.innotrader.market.domain.model.StockRanking;

import java.util.List;

public interface GetMarketUseCase {

    enum MarketType { KOSPI, KOSDAQ }

    List<IndexInfo>    getIndexInfo();
    List<ExchangeRate> getExchangeRates();
    List<StockRanking> getMarketCapRanking(MarketType market);
    List<StockRanking> getVolumeRanking(MarketType market);
    List<StockRanking> getTradingAmountRanking(MarketType market);
    List<StockRanking> getAdvancingStocks(MarketType market);
    List<StockRanking> getDecliningStocks(MarketType market);
    MarketTrend        getMarketTrend(MarketType market);
    MarketBreadth      getMarketBreadth(MarketType market);
}
