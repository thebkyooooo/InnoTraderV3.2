package com.innotrader.market.adapter.in.web;

import com.innotrader.market.adapter.in.web.dto.ExchangeRateResponse;
import com.innotrader.market.adapter.in.web.dto.IndexInfoResponse;
import com.innotrader.market.adapter.in.web.dto.MarketBreadthResponse;
import com.innotrader.market.adapter.in.web.dto.MarketTrendResponse;
import com.innotrader.market.adapter.in.web.dto.StockRankingResponse;
import com.innotrader.market.domain.port.in.GetMarketUseCase;
import com.innotrader.market.domain.port.in.GetMarketUseCase.MarketType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 시장 정보 공개 API — 인증 불필요.
 *
 * <ul>
 *   <li>GET /api/public/market/index              — 주요 지수</li>
 *   <li>GET /api/public/market/exchange           — 환율</li>
 *   <li>GET /api/public/market/ranking/market-cap — 시가총액 상위</li>
 *   <li>GET /api/public/market/ranking/volume     — 거래량 상위</li>
 *   <li>GET /api/public/market/ranking/trading-amount — 거래대금 상위</li>
 *   <li>GET /api/public/market/advancing          — 상승 종목</li>
 *   <li>GET /api/public/market/declining          — 하락 종목</li>
 *   <li>GET /api/public/market/trend              — 시장 투자동향</li>
 *   <li>GET /api/public/market/breadth            — 시장 상승/하락 현황</li>
 * </ul>
 */
@Tag(name = "시장정보", description = "시장 정보 공개 API (인증 불필요)")
@RestController
@RequestMapping("/api/public/market")
public class MarketController {

    private final GetMarketUseCase getMarketUseCase;

    public MarketController(GetMarketUseCase getMarketUseCase) {
        this.getMarketUseCase = getMarketUseCase;
    }

    @Operation(summary = "주요 지수 조회", description = "코스피, 코스닥, DOW, NASDAQ 등 8개 주요 지수 조회")
    @GetMapping("/index")
    public ResponseEntity<List<IndexInfoResponse>> getIndex() {
        return ResponseEntity.ok(
                getMarketUseCase.getIndexInfo().stream()
                        .map(IndexInfoResponse::from)
                        .toList()
        );
    }

    @Operation(summary = "환율 조회", description = "USD/KRW, JPY/KRW, EUR/KRW, GBP/KRW, CNY/KRW 환율 조회")
    @GetMapping("/exchange")
    public ResponseEntity<List<ExchangeRateResponse>> getExchange() {
        return ResponseEntity.ok(
                getMarketUseCase.getExchangeRates().stream()
                        .map(ExchangeRateResponse::from)
                        .toList()
        );
    }

    @Operation(summary = "시가총액 상위 종목", description = "시가총액 기준 상위 100개 종목")
    @GetMapping("/ranking/market-cap")
    public ResponseEntity<List<StockRankingResponse>> getMarketCapRanking(
            @Parameter(description = "시장 구분 (KOSPI/KOSDAQ)", example = "KOSPI")
            @RequestParam(defaultValue = "KOSPI") String market
    ) {
        return ResponseEntity.ok(
                getMarketUseCase.getMarketCapRanking(parseMarketType(market)).stream()
                        .map(StockRankingResponse::from)
                        .toList()
        );
    }

    @Operation(summary = "거래량 상위 종목", description = "거래량 기준 상위 100개 종목")
    @GetMapping("/ranking/volume")
    public ResponseEntity<List<StockRankingResponse>> getVolumeRanking(
            @Parameter(description = "시장 구분 (KOSPI/KOSDAQ)", example = "KOSPI")
            @RequestParam(defaultValue = "KOSPI") String market
    ) {
        return ResponseEntity.ok(
                getMarketUseCase.getVolumeRanking(parseMarketType(market)).stream()
                        .map(StockRankingResponse::from)
                        .toList()
        );
    }

    @Operation(summary = "거래대금 상위 종목", description = "거래대금 기준 상위 100개 종목")
    @GetMapping("/ranking/trading-amount")
    public ResponseEntity<List<StockRankingResponse>> getTradingAmountRanking(
            @Parameter(description = "시장 구분 (KOSPI/KOSDAQ)", example = "KOSPI")
            @RequestParam(defaultValue = "KOSPI") String market
    ) {
        return ResponseEntity.ok(
                getMarketUseCase.getTradingAmountRanking(parseMarketType(market)).stream()
                        .map(StockRankingResponse::from)
                        .toList()
        );
    }

    @Operation(summary = "상승 종목", description = "등락률 상위 상승 종목 100개")
    @GetMapping("/advancing")
    public ResponseEntity<List<StockRankingResponse>> getAdvancing(
            @Parameter(description = "시장 구분 (KOSPI/KOSDAQ)", example = "KOSPI")
            @RequestParam(defaultValue = "KOSPI") String market
    ) {
        return ResponseEntity.ok(
                getMarketUseCase.getAdvancingStocks(parseMarketType(market)).stream()
                        .map(StockRankingResponse::from)
                        .toList()
        );
    }

    @Operation(summary = "하락 종목", description = "등락률 하위 하락 종목 100개")
    @GetMapping("/declining")
    public ResponseEntity<List<StockRankingResponse>> getDeclining(
            @Parameter(description = "시장 구분 (KOSPI/KOSDAQ)", example = "KOSPI")
            @RequestParam(defaultValue = "KOSPI") String market
    ) {
        return ResponseEntity.ok(
                getMarketUseCase.getDecliningStocks(parseMarketType(market)).stream()
                        .map(StockRankingResponse::from)
                        .toList()
        );
    }

    @Operation(summary = "시장 투자동향", description = "외국인/개인/기관 순매수 (억 단위)")
    @GetMapping("/trend")
    public ResponseEntity<MarketTrendResponse> getTrend(
            @Parameter(description = "시장 구분 (KOSPI/KOSDAQ)", example = "KOSPI")
            @RequestParam(defaultValue = "KOSPI") String market
    ) {
        MarketType marketType = parseMarketType(market);
        return ResponseEntity.ok(MarketTrendResponse.from(getMarketUseCase.getMarketTrend(marketType)));
    }

    @Operation(summary = "시장 상승/하락 현황", description = "상한가/상승/보합/하락/하한가 종목 수 및 대표 종목")
    @GetMapping("/breadth")
    public ResponseEntity<MarketBreadthResponse> getBreadth(
            @Parameter(description = "시장 구분 (KOSPI/KOSDAQ)", example = "KOSPI")
            @RequestParam(defaultValue = "KOSPI") String market
    ) {
        MarketType marketType = parseMarketType(market);
        return ResponseEntity.ok(MarketBreadthResponse.from(getMarketUseCase.getMarketBreadth(marketType)));
    }

    // ─── 유틸 ────────────────────────────────────────────────────────────────

    private MarketType parseMarketType(String market) {
        return "KOSDAQ".equalsIgnoreCase(market) ? MarketType.KOSDAQ : MarketType.KOSPI;
    }
}
