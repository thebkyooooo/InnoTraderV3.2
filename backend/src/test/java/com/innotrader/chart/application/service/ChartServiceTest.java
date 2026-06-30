package com.innotrader.chart.application.service;

import com.innotrader.chart.domain.model.DailyChart;
import com.innotrader.chart.domain.model.TimeChart;
import com.innotrader.chart.domain.port.in.GetChartUseCase.ChartPage;
import com.innotrader.chart.domain.port.in.GetChartUseCase.DailyType;
import com.innotrader.chart.domain.port.in.GetChartUseCase.TimeType;
import com.innotrader.chart.domain.port.out.FindStockBasePort;
import com.innotrader.chart.domain.port.out.FindStockBasePort.StockBase;
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
@DisplayName("ChartService")
class ChartServiceTest {

    @Mock FindStockBasePort findStockBasePort;
    @InjectMocks ChartService service;

    private StockBase samsung;

    @BeforeEach
    void setUp() {
        samsung = new StockBase("삼성전자", "005930", "KOSPI",
                72300L, 870L, 1.2, 12_456_789L, 5_846_278_608L, 431_000_000L);
    }

    // ─── 일별 차트 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getDailyChart - 일봉 360건 반환")
    void getDailyChart_D_defaultSize() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<DailyChart> page = service.getDailyChart("005930", DailyType.D, 360, null);

        assertThat(page.items()).hasSize(360);
        assertThat(page.hasNext()).isTrue();
        assertThat(page.nextCursor()).isNotNull();
    }

    @Test
    @DisplayName("getDailyChart - 주봉 반환 및 date 형식 확인")
    void getDailyChart_W() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<DailyChart> page = service.getDailyChart("005930", DailyType.W, 360, null);

        assertThat(page.items()).hasSize(360);
        assertThat(page.items().get(0).date()).matches("\\d{8}");
    }

    @Test
    @DisplayName("getDailyChart - 월봉 72건 반환")
    void getDailyChart_M() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<DailyChart> page = service.getDailyChart("005930", DailyType.M, 72, null);

        assertThat(page.items()).hasSize(72);
    }

    @Test
    @DisplayName("getDailyChart - 년봉 47건 반환 (전체 풀 47건)")
    void getDailyChart_Y() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<DailyChart> page = service.getDailyChart("005930", DailyType.Y, 47, null);

        assertThat(page.items()).hasSize(47);
        assertThat(page.hasNext()).isFalse();
    }

    @Test
    @DisplayName("getDailyChart - 커서로 다음 페이지 조회 시 첫 항목이 다름")
    void getDailyChart_cursor_nextPage() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<DailyChart> first  = service.getDailyChart("005930", DailyType.D, 100, null);
        ChartPage<DailyChart> second = service.getDailyChart("005930", DailyType.D, 100, first.nextCursor());

        assertThat(second.items()).hasSize(100);
        assertThat(second.items().get(0).date()).isNotEqualTo(first.items().get(0).date());
    }

    @Test
    @DisplayName("getDailyChart - 없는 종목은 빈 페이지")
    void getDailyChart_unknownSymbol() {
        given(findStockBasePort.findBySymbol("999999")).willReturn(Optional.empty());

        ChartPage<DailyChart> page = service.getDailyChart("999999", DailyType.D, 100, null);

        assertThat(page.items()).isEmpty();
        assertThat(page.hasNext()).isFalse();
    }

    @Test
    @DisplayName("getDailyChart - 최대 9999건 초과 요청은 9999건으로 제한")
    void getDailyChart_sizeExceedsMax() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<DailyChart> page = service.getDailyChart("005930", DailyType.D, 99999, null);

        assertThat(page.items().size()).isLessThanOrEqualTo(9999);
    }

    @Test
    @DisplayName("getDailyChart - 모든 항목의 고가 >= 저가")
    void getDailyChart_highGeqLow() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<DailyChart> page = service.getDailyChart("005930", DailyType.D, 360, null);

        assertThat(page.items()).allMatch(c -> c.high() >= c.low());
        assertThat(page.items()).allMatch(c -> c.price() > 0);
    }

    // ─── 분별 차트 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getTimeChart - 1분봉 360건 반환")
    void getTimeChart_1min() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<TimeChart> page = service.getTimeChart("005930", TimeType.MIN1, 360, null);

        assertThat(page.items()).hasSize(360);
        assertThat(page.hasNext()).isTrue();
        assertThat(page.items()).allMatch(c -> c.price() > 0);
        assertThat(page.items()).allMatch(c -> c.filledVolume() > 0);
    }

    @Test
    @DisplayName("getTimeChart - 60분봉 반환 및 time 형식 확인")
    void getTimeChart_60min() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<TimeChart> page = service.getTimeChart("005930", TimeType.MIN60, 360, null);

        assertThat(page.items()).hasSize(360);
        assertThat(page.items().get(0).time()).matches("\\d{6}");
    }

    @Test
    @DisplayName("getTimeChart - 커서로 다음 페이지 조회")
    void getTimeChart_cursor() {
        given(findStockBasePort.findBySymbol("005930")).willReturn(Optional.of(samsung));

        ChartPage<TimeChart> first  = service.getTimeChart("005930", TimeType.MIN5, 100, null);
        ChartPage<TimeChart> second = service.getTimeChart("005930", TimeType.MIN5, 100, first.nextCursor());

        assertThat(second.items()).hasSize(100);
    }

    @Test
    @DisplayName("getTimeChart - 없는 종목은 빈 페이지")
    void getTimeChart_unknownSymbol() {
        given(findStockBasePort.findBySymbol("999999")).willReturn(Optional.empty());

        ChartPage<TimeChart> page = service.getTimeChart("999999", TimeType.MIN1, 100, null);

        assertThat(page.items()).isEmpty();
        assertThat(page.hasNext()).isFalse();
    }
}
