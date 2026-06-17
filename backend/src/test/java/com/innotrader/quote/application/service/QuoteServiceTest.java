package com.innotrader.quote.application.service;

import com.innotrader.quote.domain.model.DailyQuote;
import com.innotrader.quote.domain.model.FilledQuote;
import com.innotrader.quote.domain.model.HogaData;
import com.innotrader.quote.domain.model.InvestmentTrend;
import com.innotrader.quote.domain.model.QuoteDetail;
import com.innotrader.quote.domain.port.in.GetQuoteUseCase.QuotePage;
import com.innotrader.quote.domain.port.out.FindStockBasePort;
import com.innotrader.quote.domain.port.out.FindStockBasePort.StockBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("QuoteService")
class QuoteServiceTest {

    @Mock FindStockBasePort findStockBasePort;
    @InjectMocks QuoteService service;

    private StockBase samsung;

    @BeforeEach
    void setUp() {
        samsung = new StockBase("삼성전자", "005930", "KOSPI",
                72300L, 870L, 1.2, 12_456_789L, 5_846_278_608L, 431_000_000L);
    }

    // ─── 일별 시세 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getDailyQuotes - 기본 100건 반환")
    void getDailyQuotes_defaultSize() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        QuotePage<DailyQuote> page = service.getDailyQuotes("005930", 100, null);

        assertThat(page.items()).hasSize(100);
        assertThat(page.hasNext()).isTrue();
        assertThat(page.nextCursor()).isNotNull();
    }

    @Test
    @DisplayName("getDailyQuotes - 커서로 다음 페이지 조회")
    void getDailyQuotes_withCursor() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        QuotePage<DailyQuote> first  = service.getDailyQuotes("005930", 100, null);
        QuotePage<DailyQuote> second = service.getDailyQuotes("005930", 100, first.nextCursor());

        assertThat(second.items()).hasSize(100);
        assertThat(second.items().get(0).date()).isNotEqualTo(first.items().get(0).date());
    }

    @Test
    @DisplayName("getDailyQuotes - 없는 종목은 빈 페이지")
    void getDailyQuotes_unknownSymbol_returnsEmpty() {
        given(findStockBasePort.findBySymbol("999999")).willReturn(Optional.empty());

        QuotePage<DailyQuote> page = service.getDailyQuotes("999999", 100, null);

        assertThat(page.items()).isEmpty();
        assertThat(page.hasNext()).isFalse();
    }

    @Test
    @DisplayName("getDailyQuotes - 최대 9999건 초과 요청은 9999건으로 제한")
    void getDailyQuotes_sizeExceedsMax_clamped() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        QuotePage<DailyQuote> page = service.getDailyQuotes("005930", 99999, null);

        assertThat(page.items().size()).isLessThanOrEqualTo(9999);
    }

    // ─── 체결 시세 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getFilledQuotes - 기본 100건 반환")
    void getFilledQuotes_defaultSize() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        QuotePage<FilledQuote> page = service.getFilledQuotes("005930", 100, null);

        assertThat(page.items()).hasSize(100);
        assertThat(page.items()).allMatch(q -> q.price() > 0);
        assertThat(page.items()).allMatch(q -> q.volume() > 0);
    }

    // ─── 호가 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getHoga - 매도/매수 각 10호가 반환")
    void getHoga_returns10Levels() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        HogaData hoga = service.getHoga("005930").orElseThrow();

        assertThat(hoga.asks()).hasSize(10);
        assertThat(hoga.bids()).hasSize(10);
        assertThat(hoga.asks().get(0).price()).isGreaterThan(samsung.price());
        assertThat(hoga.bids().get(0).price()).isLessThan(samsung.price());
    }

    @Test
    @DisplayName("getHoga - 없는 종목은 빈 Optional")
    void getHoga_unknownSymbol_returnsEmpty() {
        given(findStockBasePort.findBySymbol("999999")).willReturn(Optional.empty());

        assertThat(service.getHoga("999999")).isEmpty();
    }

    // ─── 투자동향 ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getInvestmentTrends - 기본 100건 반환")
    void getInvestmentTrends_defaultSize() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        QuotePage<InvestmentTrend> page = service.getInvestmentTrends("005930", 100, null);

        assertThat(page.items()).hasSize(100);
        assertThat(page.items()).allMatch(t -> t.date() != null && !t.date().isBlank());
    }

    // ─── 종목 상세 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getDetail - 종목 상세 반환")
    void getDetail_returnsDetail() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        QuoteDetail detail = service.getDetail("005930").orElseThrow();

        assertThat(detail.symbol()).isEqualTo("005930");
        assertThat(detail.upperLimit()).isGreaterThan(samsung.price());
        assertThat(detail.lowerLimit()).isLessThan(samsung.price());
        assertThat(detail.high52w()).isGreaterThanOrEqualTo(detail.low52w());
        assertThat(detail.per()).isGreaterThan(0);
        assertThat(detail.pbr()).isGreaterThan(0);
    }

    @Test
    @DisplayName("getDetail - 없는 종목은 빈 Optional")
    void getDetail_unknownSymbol_returnsEmpty() {
        given(findStockBasePort.findBySymbol("999999")).willReturn(Optional.empty());

        assertThat(service.getDetail("999999")).isEmpty();
    }
}
