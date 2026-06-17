package com.innotrader.stock.adapter.in.web;

import com.innotrader.stock.adapter.in.web.dto.StockDetailResponse;
import com.innotrader.stock.adapter.in.web.dto.StockSummaryResponse;
import com.innotrader.stock.domain.port.in.GetStockMasterUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * 종목마스터 공개 API — 인증 불필요.
 *
 * <ul>
 *   <li>GET /api/public/master/stocks?market=   — 전체/시장별 종목 요약 목록</li>
 *   <li>GET /api/public/master/stocks/{symbol}  — 단일 종목 상세</li>
 *   <li>GET /api/public/master/stocks?symbols=  — 복수 종목 상세</li>
 * </ul>
 */
@Tag(name = "종목마스터", description = "종목마스터 공개 API (인증 불필요)")
@RestController
@RequestMapping("/api/public/master")
public class StockMasterController {

    private final GetStockMasterUseCase getStockMasterUseCase;

    public StockMasterController(GetStockMasterUseCase getStockMasterUseCase) {
        this.getStockMasterUseCase = getStockMasterUseCase;
    }

    // ─── GET /stocks?market= ─────────────────────────────────────────────────

    @Operation(
        summary = "전체/시장별 종목 요약 목록",
        description = "market 파라미터로 필터링. 미입력 또는 ALL 이면 전체 반환."
    )
    @GetMapping("/stocks")
    public ResponseEntity<List<StockSummaryResponse>> getStocks(
            @Parameter(description = "시장구분 (ALL | KOSPI | KOSDAQ)", example = "KOSPI")
            @RequestParam(required = false) String market
    ) {
        List<StockSummaryResponse> result = getStockMasterUseCase.getByMarket(market)
                .stream().map(StockSummaryResponse::from).toList();
        return ResponseEntity.ok(result);
    }

    // ─── GET /stocks/{symbol} ────────────────────────────────────────────────

    @Operation(summary = "단일 종목 상세", description = "종목코드로 단일 종목 상세 시세 조회.")
    @GetMapping("/stocks/{symbol}")
    public ResponseEntity<StockDetailResponse> getStock(
            @Parameter(description = "종목코드", example = "005930")
            @PathVariable String symbol
    ) {
        return getStockMasterUseCase.getBySymbol(symbol)
                .map(StockDetailResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── GET /stocks/batch?symbols= ──────────────────────────────────────────

    @Operation(
        summary = "복수 종목 상세 목록",
        description = "쉼표로 구분된 종목코드 목록으로 복수 종목 상세 시세 조회."
    )
    @GetMapping("/stocks/batch")
    public ResponseEntity<List<StockDetailResponse>> getStocksBatch(
            @Parameter(description = "종목코드 쉼표 구분", example = "005930,000660,035420")
            @RequestParam String symbols
    ) {
        List<String> symbolList = Arrays.asList(symbols.split(","));
        List<StockDetailResponse> result = getStockMasterUseCase.getBySymbols(symbolList)
                .stream().map(StockDetailResponse::from).toList();
        return ResponseEntity.ok(result);
    }
}
