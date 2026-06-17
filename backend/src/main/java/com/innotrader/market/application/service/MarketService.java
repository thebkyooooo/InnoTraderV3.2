package com.innotrader.market.application.service;

import com.innotrader.common.annotation.UseCase;
import com.innotrader.market.domain.model.ExchangeRate;
import com.innotrader.market.domain.model.IndexInfo;
import com.innotrader.market.domain.model.MarketBreadth;
import com.innotrader.market.domain.model.MarketTrend;
import com.innotrader.market.domain.model.StockBreadthItem;
import com.innotrader.market.domain.model.StockRanking;
import com.innotrader.market.domain.port.in.GetMarketUseCase;
import com.innotrader.market.domain.port.out.FindMarketDataPort;
import com.innotrader.market.domain.port.out.FindMarketDataPort.StockData;

import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.stream.IntStream;

@UseCase
public class MarketService implements GetMarketUseCase {

    private static final int RANKING_LIMIT = 100;
    private static final int BREADTH_LIMIT = 10;

    private final FindMarketDataPort findMarketDataPort;

    public MarketService(FindMarketDataPort findMarketDataPort) {
        this.findMarketDataPort = findMarketDataPort;
    }

    // ─── 지수 ──────────────────────────────────────────────────────────────────

    @Override
    public List<IndexInfo> getIndexInfo() {
        record IndexSpec(String code, String name, double min, double max) {}

        List<IndexSpec> specs = List.of(
                new IndexSpec("KS11",   "코스피",       2400, 2700),
                new IndexSpec("KQ11",   "코스닥",        720,  850),
                new IndexSpec("DJI",    "DOW",          38000, 42000),
                new IndexSpec("COMP",   "NASDAQ",       16000, 18000),
                new IndexSpec("INX",    "S&P 500",       5000,  5500),
                new IndexSpec("N225",   "니케이 225",   38000, 42000),
                new IndexSpec("000001", "상하이 종합",   3000,  3300),
                new IndexSpec("HSI",    "항셍",         16000, 19000)
        );

        return IntStream.range(0, specs.size())
                .mapToObj(i -> {
                    IndexSpec s = specs.get(i);
                    Random rng = new Random(42L + i);
                    double price    = round2(s.min() + rng.nextDouble() * (s.max() - s.min()));
                    double prevDiff = round2(price * (rng.nextDouble() - 0.5) * 0.04);
                    double change   = round1(prevDiff / price * 100);
                    return new IndexInfo(s.code(), s.name(), price, prevDiff, change);
                })
                .toList();
    }

    // ─── 환율 ──────────────────────────────────────────────────────────────────

    @Override
    public List<ExchangeRate> getExchangeRates() {
        record RateSpec(String pair, String name, double min, double max) {}

        List<RateSpec> specs = List.of(
                new RateSpec("USD/KRW", "미국 달러/원",      1300, 1400),
                new RateSpec("JPY/KRW", "일본 엔/원",          8.5,  9.5),
                new RateSpec("EUR/KRW", "유로/원",            1400, 1500),
                new RateSpec("GBP/KRW", "영국 파운드/원",     1600, 1700),
                new RateSpec("CNY/KRW", "중국 위안(RMB)/원",   175,  190)
        );

        return IntStream.range(0, specs.size())
                .mapToObj(i -> {
                    RateSpec s = specs.get(i);
                    Random rng = new Random(99L + i);
                    double rate     = round2(s.min() + rng.nextDouble() * (s.max() - s.min()));
                    double prevDiff = round2(rate * (rng.nextDouble() - 0.5) * 0.04);
                    double change   = round1(prevDiff / rate * 100);
                    return new ExchangeRate(s.pair(), s.name(), rate, prevDiff, change);
                })
                .toList();
    }

    // ─── 랭킹 ──────────────────────────────────────────────────────────────────

    @Override
    public List<StockRanking> getMarketCapRanking(MarketType market) {
        return byMarket(market).stream()
                .sorted(Comparator.comparingLong(StockData::marketCap).reversed())
                .limit(RANKING_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list, true, false, false)
                ));
    }

    @Override
    public List<StockRanking> getVolumeRanking(MarketType market) {
        return byMarket(market).stream()
                .sorted(Comparator.comparingLong(StockData::volume).reversed())
                .limit(RANKING_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list, false, true, false)
                ));
    }

    @Override
    public List<StockRanking> getTradingAmountRanking(MarketType market) {
        return byMarket(market).stream()
                .sorted(Comparator.comparingLong(StockData::tradingAmount).reversed())
                .limit(RANKING_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list, false, false, true)
                ));
    }

    @Override
    public List<StockRanking> getAdvancingStocks(MarketType market) {
        return byMarket(market).stream()
                .filter(s -> s.change() > 0)
                .sorted(Comparator.comparingDouble(StockData::change).reversed())
                .limit(RANKING_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list, false, false, false)
                ));
    }

    @Override
    public List<StockRanking> getDecliningStocks(MarketType market) {
        return byMarket(market).stream()
                .filter(s -> s.change() < 0)
                .sorted(Comparator.comparingDouble(StockData::change))
                .limit(RANKING_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list, false, false, false)
                ));
    }

    // ─── 투자동향 ───────────────────────────────────────────────────────────────

    @Override
    public MarketTrend getMarketTrend(MarketType market) {
        long seed = market == MarketType.KOSPI ? 1L : 2L;
        Random rng = new Random(seed);
        long foreign     = randomTrend(rng);
        long individual  = randomTrend(rng);
        long institution = -(foreign + individual);
        return new MarketTrend(foreign, individual, institution);
    }

    // ─── 시장 상승/하락 ────────────────────────────────────────────────────────

    @Override
    public MarketBreadth getMarketBreadth(MarketType market) {
        String marketName = market == MarketType.KOSPI ? "KOSPI" : "KOSDAQ";

        List<StockData> filtered = findMarketDataPort.findAll().stream()
                .filter(s -> marketName.equalsIgnoreCase(s.market()))
                .toList();

        List<StockData> upperLimit = filtered.stream()
                .filter(s -> s.change() >= 29.9)
                .toList();
        List<StockData> rising = filtered.stream()
                .filter(s -> s.change() > 0 && s.change() < 29.9)
                .toList();
        List<StockData> flat = filtered.stream()
                .filter(s -> s.change() == 0)
                .toList();
        List<StockData> falling = filtered.stream()
                .filter(s -> s.change() < 0 && s.change() > -29.9)
                .toList();
        List<StockData> lowerLimit = filtered.stream()
                .filter(s -> s.change() <= -29.9)
                .toList();

        return new MarketBreadth(
                upperLimit.size(),
                rising.size(),
                flat.size(),
                falling.size(),
                lowerLimit.size(),
                toBreadthItems(upperLimit, BREADTH_LIMIT),
                toBreadthItems(rising, BREADTH_LIMIT),
                toBreadthItems(flat, BREADTH_LIMIT),
                toBreadthItems(falling, BREADTH_LIMIT),
                toBreadthItems(lowerLimit, BREADTH_LIMIT)
        );
    }

    // ─── 유틸 ──────────────────────────────────────────────────────────────────

    private List<StockData> byMarket(MarketType market) {
        String name = market == MarketType.KOSPI ? "KOSPI" : "KOSDAQ";
        return findMarketDataPort.findAll().stream()
                .filter(s -> name.equalsIgnoreCase(s.market()))
                .toList();
    }

    private List<StockRanking> rankWith(List<StockData> sorted,
                                        boolean withMarketCap,
                                        boolean withVolume,
                                        boolean withTradingAmount) {
        return IntStream.range(0, sorted.size())
                .mapToObj(i -> {
                    StockData s = sorted.get(i);
                    return new StockRanking(
                            i + 1,
                            s.symbol(),
                            s.name(),
                            s.price(),
                            s.prevDiff(),
                            s.change(),
                            withMarketCap   ? s.marketCap()    : null,
                            withVolume      ? s.volume()       : null,
                            withTradingAmount ? s.tradingAmount() : null
                    );
                })
                .toList();
    }

    private List<StockBreadthItem> toBreadthItems(List<StockData> list, int limit) {
        return list.stream()
                .limit(limit)
                .map(s -> new StockBreadthItem(s.symbol(), s.name(), s.price(), s.prevDiff(), s.change()))
                .toList();
    }

    private long randomTrend(Random rng) {
        return Math.round((rng.nextDouble() - 0.5) * 2 * 5000);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
