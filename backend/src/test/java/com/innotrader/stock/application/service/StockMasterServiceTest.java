package com.innotrader.stock.application.service;

import com.innotrader.stock.domain.model.StockMaster;
import com.innotrader.stock.domain.port.out.LoadStockMasterPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("StockMasterService")
class StockMasterServiceTest {

    @Mock
    LoadStockMasterPort loadStockMasterPort;

    @InjectMocks
    StockMasterService service;

    private List<StockMaster> fixtures;

    @BeforeEach
    void setUp() {
        fixtures = List.of(
                new StockMaster("KOSPI",  1, "삼성전자",  "005930", 72300,  870,  1.2, 12456789, 5846278608L, 431000000L),
                new StockMaster("KOSPI",  2, "SK하이닉스", "000660", 198500, -1596, -0.8, 3214567, 712702365L, 144000000L),
                new StockMaster("KOSDAQ", 1, "에코프로",   "086520", 98000,  1960,  2.0, 987654,  76000000L,   7400000L)
        );
    }

    @Test
    @DisplayName("getByMarket(ALL) - 전체 종목 반환")
    void getByMarket_ALL_returnsAll() {
        given(loadStockMasterPort.loadAll()).willReturn(fixtures);

        List<StockMaster> result = service.getByMarket("ALL");

        assertThat(result).hasSize(3);
    }

    @Test
    @DisplayName("getByMarket(null) - 전체 종목 반환")
    void getByMarket_null_returnsAll() {
        given(loadStockMasterPort.loadAll()).willReturn(fixtures);

        List<StockMaster> result = service.getByMarket(null);

        assertThat(result).hasSize(3);
    }

    @Test
    @DisplayName("getByMarket(KOSPI) - KOSPI 종목만 반환")
    void getByMarket_KOSPI_returnsOnlyKospi() {
        given(loadStockMasterPort.loadAll()).willReturn(fixtures);

        List<StockMaster> result = service.getByMarket("KOSPI");

        assertThat(result).hasSize(2)
                .allMatch(s -> "KOSPI".equals(s.market()));
    }

    @Test
    @DisplayName("getByMarket(KOSDAQ) - KOSDAQ 종목만 반환")
    void getByMarket_KOSDAQ_returnsOnlyKosdaq() {
        given(loadStockMasterPort.loadAll()).willReturn(fixtures);

        List<StockMaster> result = service.getByMarket("KOSDAQ");

        assertThat(result).hasSize(1)
                .allMatch(s -> "KOSDAQ".equals(s.market()));
    }

    @Test
    @DisplayName("getBySymbol - 존재하는 종목코드 반환")
    void getBySymbol_existing_returnsStock() {
        given(loadStockMasterPort.loadBySymbol("005930"))
                .willReturn(Optional.of(fixtures.get(0)));

        Optional<StockMaster> result = service.getBySymbol("005930");

        assertThat(result).isPresent()
                .get().extracting(StockMaster::symbol).isEqualTo("005930");
    }

    @Test
    @DisplayName("getBySymbol - 존재하지 않는 종목코드 빈 Optional 반환")
    void getBySymbol_notExisting_returnsEmpty() {
        given(loadStockMasterPort.loadBySymbol("999999"))
                .willReturn(Optional.empty());

        Optional<StockMaster> result = service.getBySymbol("999999");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getBySymbols - 일치하는 종목 목록 반환")
    void getBySymbols_returnsMatchingStocks() {
        given(loadStockMasterPort.loadAll()).willReturn(fixtures);

        List<StockMaster> result = service.getBySymbols(List.of("005930", "086520"));

        assertThat(result).hasSize(2)
                .extracting(StockMaster::symbol)
                .containsExactlyInAnyOrder("005930", "086520");
    }

    @Test
    @DisplayName("getBySymbols - 없는 코드 포함 시 일치하는 것만 반환")
    void getBySymbols_withUnknownSymbol_returnsOnlyMatching() {
        given(loadStockMasterPort.loadAll()).willReturn(fixtures);

        List<StockMaster> result = service.getBySymbols(List.of("005930", "999999"));

        assertThat(result).hasSize(1)
                .extracting(StockMaster::symbol)
                .containsOnly("005930");
    }

    @Test
    @DisplayName("StockMaster 파생값 - 거래금액(만) 계산 검증")
    void stockMaster_turnoverMan_calculated() {
        StockMaster stock = fixtures.get(0); // price=72300, volume=12456789

        assertThat(stock.turnoverMan()).isEqualTo(72300L * 12456789L / 10_000L);
    }
}
