package com.innotrader.quote.application.service;

import com.innotrader.common.annotation.UseCase;
import com.innotrader.common.support.DailyBar;
import com.innotrader.common.support.MockDailySeries;
import com.innotrader.common.support.MockIntradaySeries;
import com.innotrader.common.support.PriceTick;
import com.innotrader.quote.domain.model.CurrentPrice;
import com.innotrader.quote.domain.model.DailyQuote;
import com.innotrader.quote.domain.model.FilledQuote;
import com.innotrader.quote.domain.model.HogaData;
import com.innotrader.quote.domain.model.HogaEntry;
import com.innotrader.quote.domain.model.InvestmentTrend;
import com.innotrader.quote.domain.model.QuoteDetail;
import com.innotrader.quote.domain.port.in.GetQuoteUseCase;
import com.innotrader.quote.domain.port.out.FindStockBasePort;
import com.innotrader.quote.domain.port.out.FindStockBasePort.StockBase;

import java.time.Duration;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@UseCase
public class QuoteService implements GetQuoteUseCase {

    private static final int  DEFAULT_SIZE = 100;
    private static final int  MAX_SIZE     = 9999;
    private static final int  MAX_DAILY    = 3000; // ~12년치 영업일
    private static final int  MAX_FILLED   = 9999;

    private final FindStockBasePort findStockBasePort;

    public QuoteService(FindStockBasePort findStockBasePort) {
        this.findStockBasePort = findStockBasePort;
    }

    // ─── 현재가 ──────────────────────────────────────────────────────────────

    @Override
    public Optional<CurrentPrice> getCurrentPrice(String symbol) {
        return findStockBasePort.findBySymbol(symbol)
                .map(this::generateCurrentPrice);
    }

    // ─── 일별 시세 ────────────────────────────────────────────────────────────

    @Override
    public QuotePage<DailyQuote> getDailyQuotes(String symbol, int size, String cursor) {
        int sz     = clampSize(size);
        int offset = decodeCursor(cursor);
        return findStockBasePort.findBySymbol(symbol)
                .map(base -> {
                    List<DailyQuote> all  = generateDailyQuotes(base);
                    return buildPage(all, offset, sz);
                })
                .orElse(emptyPage());
    }

    // ─── 체결 시세 ───────────────────────────────────────────────────────────

    @Override
    public QuotePage<FilledQuote> getFilledQuotes(String symbol, int size, String cursor) {
        int sz     = clampSize(size);
        int offset = decodeCursor(cursor);
        return findStockBasePort.findBySymbol(symbol)
                .map(base -> {
                    List<FilledQuote> all = generateFilledQuotes(base);
                    return buildPage(all, offset, sz);
                })
                .orElse(emptyPage());
    }

    // ─── 호가 ────────────────────────────────────────────────────────────────

    @Override
    public Optional<HogaData> getHoga(String symbol) {
        return findStockBasePort.findBySymbol(symbol)
                .map(this::generateHoga);
    }

    // ─── 투자동향 ────────────────────────────────────────────────────────────

    @Override
    public QuotePage<InvestmentTrend> getInvestmentTrends(String symbol, int size, String cursor) {
        int sz     = clampSize(size);
        int offset = decodeCursor(cursor);
        return findStockBasePort.findBySymbol(symbol)
                .map(base -> {
                    List<InvestmentTrend> all = generateInvestmentTrends(base);
                    return buildPage(all, offset, sz);
                })
                .orElse(emptyPage());
    }

    // ─── 종목 상세 ───────────────────────────────────────────────────────────

    @Override
    public Optional<QuoteDetail> getDetail(String symbol) {
        return findStockBasePort.findBySymbol(symbol)
                .map(this::generateDetail);
    }

    // ─── 합성 데이터 생성 ─────────────────────────────────────────────────────

    private CurrentPrice generateCurrentPrice(StockBase base) {
        long seed = (long) base.symbol().hashCode() * 53;
        Random r = new Random(seed);

        long prevClose    = PriceTick.round(base.price() - base.prevDiff());
        long open         = Math.max(100L, PriceTick.round(Math.round(prevClose * (1 + (r.nextDouble() - 0.5) * 0.01))));
        long high         = PriceTick.round(Math.max(base.price(), open) + Math.abs(r.nextLong() % (base.price() / 200 + 1)));
        long low          = Math.max(100L, PriceTick.round(Math.min(base.price(), open) - Math.abs(r.nextLong() % (base.price() / 200 + 1))));
        long upperLimit   = PriceTick.round(Math.round(prevClose * 1.3));
        long lowerLimit   = PriceTick.round(Math.round(prevClose * 0.7));
        long tradingAmount = base.volume() * base.price() / 10_000L;

        return new CurrentPrice(
                base.symbol(), base.name(), base.market(),
                base.price(), base.prevDiff(), base.change(),
                base.volume(), open, high, low, prevClose,
                upperLimit, lowerLimit, tradingAmount
        );
    }

    private List<DailyQuote> generateDailyQuotes(StockBase base) {
        // 일별 그리드 · 차트 일봉 · 투자동향이 공유하는 공통 일봉 시리즈
        List<DailyBar> bars = MockDailySeries.generate(
                base.symbol(), base.price(), base.prevDiff(), base.volume(), MAX_DAILY);
        List<DailyQuote> result = new ArrayList<>(bars.size());
        for (DailyBar b : bars) {
            result.add(new DailyQuote(
                    b.date(), b.close(), b.prevDiff(), b.change(),
                    b.open(), b.high(), b.low(), b.volume(), b.turnoverMan()
            ));
        }
        return result;
    }

    private List<FilledQuote> generateFilledQuotes(StockBase base) {
        LocalTime open  = LocalTime.of(9, 0);
        LocalTime close = LocalTime.of(15, 30);
        // 09:00 ~ 현재 시각(KST)까지만 생성. 장 시작 전=0, 장 마감 후=390분(15:30)으로 클램프
        LocalTime nowKst = LocalTime.now(ZoneId.of("Asia/Seoul"));
        int totalMinutes;
        if (nowKst.isBefore(open))      totalMinutes = 0;
        else if (nowKst.isAfter(close)) totalMinutes = 390;
        else                            totalMinutes = (int) Duration.between(open, nowKst).toMinutes();

        // 체결도 오늘 일봉(시가)→현재가 브리지로 생성되어 최근 체결가 = 현재가
        List<MockIntradaySeries.Tick> ticks = MockIntradaySeries.filledTicks(
                base.symbol(), base.price(), base.prevDiff(), base.volume(), totalMinutes, MAX_FILLED,
                PriceTick.tickSize(base.price()));
        List<FilledQuote> result = new ArrayList<>(ticks.size());
        for (MockIntradaySeries.Tick t : ticks) {
            result.add(new FilledQuote(
                    t.time(), t.price(), t.prevDiff(), t.change(),
                    t.ask(), t.bid(), t.filledVolume(), t.strength(), t.cumVolume()
            ));
        }
        return result;
    }

    private HogaData generateHoga(StockBase base) {
        long basePrice = PriceTick.round(base.price());
        long tick = PriceTick.tickSize(basePrice);  // 가격대별 호가 단위
        long seed = (long) base.symbol().hashCode() * 41;
        Random r = new Random(seed);

        List<HogaEntry> asks = new ArrayList<>();
        List<HogaEntry> bids = new ArrayList<>();

        // 매도 10호가: 현재가 위로 (호가 단위 간격)
        for (int i = 1; i <= 10; i++) {
            long price = basePrice + tick * i;
            long vol = Math.max(100L, Math.abs(r.nextLong()) % 50000 + 1000);
            asks.add(new HogaEntry(price, vol));
        }
        // 매수 10호가: 현재가 아래로
        for (int i = 1; i <= 10; i++) {
            long price = Math.max(tick, basePrice - tick * i);
            long vol = Math.max(100L, Math.abs(r.nextLong()) % 50000 + 1000);
            bids.add(new HogaEntry(price, vol));
        }
        return new HogaData(asks, bids);
    }

    private List<InvestmentTrend> generateInvestmentTrends(StockBase base) {
        // 날짜·종가·전일대비·거래량은 일별 시세와 동일한 공통 시리즈를 사용하고,
        // 외국인/개인/기관 순매수만 별도 결정적 난수로 파생한다.
        List<DailyBar> bars = MockDailySeries.generate(
                base.symbol(), base.price(), base.prevDiff(), base.volume(), MAX_DAILY);
        List<InvestmentTrend> result = new ArrayList<>(bars.size());
        for (int i = 0; i < bars.size(); i++) {
            DailyBar b = bars.get(i);
            Random r = new Random((long) base.symbol().hashCode() * 43 + i);
            long vol         = b.volume();
            long foreign     = (long) ((r.nextDouble() - 0.5) * vol * 0.4);
            long individual  = (long) ((r.nextDouble() - 0.5) * vol * 0.6);
            long institution = -foreign - individual + (long) ((r.nextDouble() - 0.5) * vol * 0.1);
            result.add(new InvestmentTrend(
                    b.date(), b.close(), b.prevDiff(), b.change(), vol,
                    foreign, individual, institution
            ));
        }
        return result;
    }

    private QuoteDetail generateDetail(StockBase base) {
        long seed = (long) base.symbol().hashCode() * 47;
        Random r = new Random(seed);

        long   parValue    = List.of(100L, 500L, 1000L, 5000L).get(r.nextInt(4));
        long   upperLimit  = PriceTick.round(Math.round(base.price() * 1.3));
        long   lowerLimit  = PriceTick.round(Math.round(base.price() * 0.7));
        long   high52w     = PriceTick.round(Math.round(base.price() * (1.1 + r.nextDouble() * 0.4)));
        long   low52w      = PriceTick.round(Math.round(base.price() * (0.5 + r.nextDouble() * 0.3)));
        double per         = 8.0 + r.nextDouble() * 32;
        long   eps         = base.price() == 0 ? 0 : Math.round(base.price() / per);
        double pbr         = 0.3 + r.nextDouble() * 3.0;
        long   bps         = pbr == 0 ? 0 : Math.round(base.price() / pbr);

        return new QuoteDetail(
                base.name(), base.symbol(),
                base.marketCap(), base.lstdShrs(), parValue,
                upperLimit, lowerLimit, high52w, low52w,
                Math.round(per * 10.0) / 10.0, eps,
                Math.round(pbr * 100.0) / 100.0, bps
        );
    }

    // ─── 페이징 유틸 ──────────────────────────────────────────────────────────

    private <T> QuotePage<T> buildPage(List<T> all, int offset, int size) {
        if (offset >= all.size()) return emptyPage();
        int end     = Math.min(offset + size, all.size());
        boolean hasNext = end < all.size();
        String  next    = hasNext ? encodeCursor(end) : null;
        return new QuotePage<>(all.subList(offset, end), next, hasNext);
    }

    private <T> QuotePage<T> emptyPage() {
        return new QuotePage<>(List.of(), null, false);
    }

    private int clampSize(int size) {
        if (size <= 0) return DEFAULT_SIZE;
        return Math.min(size, MAX_SIZE);
    }

    private int decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0;
        try {
            return Integer.parseInt(new String(Base64.getDecoder().decode(cursor)));
        } catch (Exception e) {
            return 0;
        }
    }

    private String encodeCursor(int offset) {
        return Base64.getEncoder().encodeToString(String.valueOf(offset).getBytes());
    }
}
