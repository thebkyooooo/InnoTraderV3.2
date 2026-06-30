package com.innotrader.market.application.service;

import com.innotrader.common.annotation.UseCase;
import com.innotrader.market.domain.model.ExchangeRate;
import com.innotrader.market.domain.model.IndexInfo;
import com.innotrader.market.domain.model.MarketBreadth;
import com.innotrader.market.domain.model.MarketTrend;
import com.innotrader.market.domain.model.StockBreadthItem;
import com.innotrader.market.domain.model.StockRanking;
import com.innotrader.market.domain.model.DailyTrendPage;
import com.innotrader.market.domain.port.in.GetMarketUseCase;
import com.innotrader.market.domain.port.out.FindDailyTrendPort;
import com.innotrader.market.domain.port.out.FindMarketDataPort;
import com.innotrader.market.domain.port.out.FindMarketDataPort.StockData;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.stream.IntStream;

@UseCase
public class MarketService implements GetMarketUseCase {

    private static final int RANKING_LIMIT = 100;
    private static final int BREADTH_LIMIT = 10;

    private final FindMarketDataPort findMarketDataPort;
    private final FindDailyTrendPort findDailyTrendPort;

    public MarketService(FindMarketDataPort findMarketDataPort, FindDailyTrendPort findDailyTrendPort) {
        this.findMarketDataPort = findMarketDataPort;
        this.findDailyTrendPort = findDailyTrendPort;
    }

    // ─── 지수 ──────────────────────────────────────────────────────────────────

    @Override
    public List<IndexInfo> getIndexInfo() {
        record IndexSpec(String code, String name, double base) {}

        // base = 기준값(현재가). 전일대비/등락률만 변동 생성한다.
        List<IndexSpec> specs = List.of(
                new IndexSpec("KS11",   "코스피",       8713.42),
                new IndexSpec("KQ11",   "코스닥",          845.24),
                new IndexSpec("DJI",    "DOW",          50866.78),
                new IndexSpec("COMP",   "NASDAQ",       22881.38),
                new IndexSpec("INX",    "S&P 500",       7383.74),
                new IndexSpec("N225",   "니케이 225",   69212.26),
                new IndexSpec("000001", "상하이 종합",   4096.47),
                new IndexSpec("HSI",    "항셍",         24961.95)
        );

        return IntStream.range(0, specs.size())
                .mapToObj(i -> {
                    IndexSpec s = specs.get(i);
                    Random rng = new Random(42L + i);
                    double price    = round2(s.base());
                    double prevDiff = round2(price * (rng.nextDouble() - 0.5) * 0.04);
                    double change   = round1(prevDiff / price * 100);
                    return new IndexInfo(s.code(), s.name(), price, prevDiff, change);
                })
                .toList();
    }

    // ─── 환율 ──────────────────────────────────────────────────────────────────

    @Override
    public List<ExchangeRate> getExchangeRates() {
        record RateSpec(String pair, String name, double base) {}

        // base = 기준 환율. 전일대비/등락률만 변동 생성한다.
        List<RateSpec> specs = List.of(
                new RateSpec("USD/KRW", "미국 달러/원",      1548.80),
                new RateSpec("JPY/KRW", "일본 엔/원",           9.57),
                new RateSpec("EUR/KRW", "유로/원",            1758.8),
                new RateSpec("GBP/KRW", "영국 파운드/원",     2039.2),
                new RateSpec("CNY/KRW", "중국 위안(RMB)/원",   227.6)
        );

        return IntStream.range(0, specs.size())
                .mapToObj(i -> {
                    RateSpec s = specs.get(i);
                    Random rng = new Random(99L + i);
                    double rate     = round2(s.base());
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
                        list -> rankWith(list)
                ));
    }

    @Override
    public List<StockRanking> getVolumeRanking(MarketType market) {
        return byMarket(market).stream()
                .sorted(Comparator.comparingLong(StockData::volume).reversed())
                .limit(RANKING_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list)
                ));
    }

    @Override
    public List<StockRanking> getTradingAmountRanking(MarketType market) {
        return byMarket(market).stream()
                .sorted(Comparator.comparingLong(StockData::tradingAmount).reversed())
                .limit(RANKING_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list)
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
                        list -> rankWith(list)
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
                        list -> rankWith(list)
                ));
    }

    // ─── 갭상승 / 투자심리과열 / 인기검색 ─────────────────────────────────────────

    @Override
    public List<StockRanking> getGapUpStocks(MarketType market) {
        // 시가/전일종가 필드가 없어 결정적 보조기준(symbol 해시 가중치 + change)으로 갭상승을 시뮬레이션한다.
        return byMarket(market).stream()
                .filter(s -> s.change() > 0)
                .sorted(Comparator.comparingDouble(this::gapScore).reversed())
                .limit(RANKING_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list)
                ));
    }

    @Override
    public List<StockRanking> getOverheatedStocks(MarketType market) {
        // 과열 시뮬레이션 — 등락률 절대값 * 거래량 기준 상위 100.
        return byMarket(market).stream()
                .sorted(Comparator.comparingDouble(this::overheatScore).reversed())
                .limit(RANKING_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list)
                ));
    }

    @Override
    public List<StockRanking> getTrendingStocks() {
        // 인기검색 — 시장 무관 전체에서 거래대금 상위 10개.
        return findMarketDataPort.findAll().stream()
                .sorted(Comparator.comparingLong(StockData::tradingAmount).reversed())
                .limit(BREADTH_LIMIT)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> rankWith(list)
                ));
    }

    // ─── 투자동향 ───────────────────────────────────────────────────────────────

    @Override
    public MarketTrend getMarketTrend(MarketType market) {
        long seed = switch (market) { case KOSPI -> 1L; case KOSDAQ -> 2L; case ALL -> 3L; };
        Random rng = new Random(seed);
        long foreign     = randomTrend(rng);
        long individual  = randomTrend(rng);
        long institution = -(foreign + individual);
        return new MarketTrend(foreign, individual, institution);
    }

    // ─── 시장 상승/하락 ────────────────────────────────────────────────────────

    @Override
    public MarketBreadth getMarketBreadth(MarketType market) {
        List<StockData> filtered = byMarket(market);   // ALL이면 전체

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
        List<StockData> all = findMarketDataPort.findAll();
        if (market == MarketType.ALL) return all;   // 전체 시장
        String name = market == MarketType.KOSPI ? "KOSPI" : "KOSDAQ";
        return all.stream()
                .filter(s -> name.equalsIgnoreCase(s.market()))
                .toList();
    }

    private List<StockRanking> rankWith(List<StockData> sorted) {
        return IntStream.range(0, sorted.size())
                .mapToObj(i -> {
                    StockData s = sorted.get(i);
                    return new StockRanking(
                            i + 1,
                            s.symbol(),
                            s.name(),
                            s.market(),
                            s.price(),
                            s.prevDiff(),
                            s.change(),
                            s.marketCap(),
                            s.volume(),
                            s.tradingAmount()
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

    /** 갭상승 결정적 점수 — symbol 해시 가중치 + 등락률. (시가/전일종가 부재 보완) */
    private double gapScore(StockData s) {
        int hash = Math.abs(s.symbol().hashCode());
        double weight = (hash % 1000) / 100.0;  // 0.00 ~ 9.99 결정적 가중치
        return s.change() + weight;
    }

    /** 과열 결정적 점수 — 등락률 절대값 * 거래량. */
    private double overheatScore(StockData s) {
        return Math.abs(s.change()) * s.volume();
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

    // ─── 일별 투자동향 ─────────────────────────────────────────────────────────

    @Override
    public DailyTrendPage getDailyTrends(MarketType market, int size, LocalDate cursor) {
        int clampedSize = Math.min(Math.max(size, 1), 9999);
        var items = findDailyTrendPort.findByMarket(market, clampedSize, cursor);
        LocalDate nextCursor = items.size() == clampedSize
                ? items.get(items.size() - 1).tradeDate()
                : null;
        return new DailyTrendPage(items, nextCursor);
    }
}
