package com.innotrader.quote.adapter.in.web;

import com.innotrader.quote.adapter.in.web.dto.CurrentPriceResponse;
import com.innotrader.quote.adapter.in.web.dto.DailyQuoteResponse;
import com.innotrader.quote.adapter.in.web.dto.FilledQuoteResponse;
import com.innotrader.quote.adapter.in.web.dto.HogaResponse;
import com.innotrader.quote.adapter.in.web.dto.InvestmentTrendResponse;
import com.innotrader.quote.adapter.in.web.dto.PageResponse;
import com.innotrader.quote.adapter.in.web.dto.QuoteDetailResponse;
import com.innotrader.quote.domain.port.in.GetQuoteUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 종목 시세 공개 API — 인증 불필요.
 *
 * <ul>
 *   <li>GET /api/public/quotes/price       — 현재가</li>
 *   <li>GET /api/public/quotes/daily       — 일별 시세</li>
 *   <li>GET /api/public/quotes/filled      — 체결 시세</li>
 *   <li>GET /api/public/quotes/hoga        — 호가</li>
 *   <li>GET /api/public/quotes/trends      — 투자동향</li>
 *   <li>GET /api/public/quotes/detail      — 종목 상세</li>
 * </ul>
 */
@Tag(name = "종목시세", description = "종목 시세 공개 API (인증 불필요)")
@RestController
@RequestMapping("/api/public/quotes")
public class QuoteController {

    private final GetQuoteUseCase getQuoteUseCase;

    public QuoteController(GetQuoteUseCase getQuoteUseCase) {
        this.getQuoteUseCase = getQuoteUseCase;
    }

    // ─── 현재가 ──────────────────────────────────────────────────────────────

    @Operation(summary = "현재가 조회")
    @GetMapping("/price")
    public ResponseEntity<CurrentPriceResponse> getPrice(
            @Parameter(description = "종목코드", required = true, example = "005930")
            @RequestParam String symbol
    ) {
        return getQuoteUseCase.getCurrentPrice(symbol)
                .map(CurrentPriceResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── 일별 시세 ────────────────────────────────────────────────────────────

    @Operation(summary = "일별 시세 조회",
               description = "디폴트 100건, 최대 9999건. nextCursor 로 다음 페이지 조회.")
    @GetMapping("/daily")
    public ResponseEntity<PageResponse<DailyQuoteResponse>> getDaily(
            @Parameter(description = "종목코드", required = true, example = "005930")
            @RequestParam String symbol,
            @Parameter(description = "조회건수 (기본 100, 최대 9999)", example = "100")
            @RequestParam(defaultValue = "100") int size,
            @Parameter(description = "페이지 커서 (첫 조회 시 생략)")
            @RequestParam(required = false) String cursor
    ) {
        return ResponseEntity.ok(PageResponse.from(
                getQuoteUseCase.getDailyQuotes(symbol, size, cursor)
                        .map(DailyQuoteResponse::from)));
    }

    // ─── 체결 시세 ───────────────────────────────────────────────────────────

    @Operation(summary = "체결 시세 조회",
               description = "디폴트 100건, 최대 9999건. nextCursor 로 다음 페이지 조회.")
    @GetMapping("/filled")
    public ResponseEntity<PageResponse<FilledQuoteResponse>> getFilled(
            @Parameter(description = "종목코드", required = true, example = "005930")
            @RequestParam String symbol,
            @Parameter(description = "조회건수 (기본 100, 최대 9999)", example = "100")
            @RequestParam(defaultValue = "100") int size,
            @Parameter(description = "페이지 커서 (첫 조회 시 생략)")
            @RequestParam(required = false) String cursor
    ) {
        return ResponseEntity.ok(PageResponse.from(
                getQuoteUseCase.getFilledQuotes(symbol, size, cursor)
                        .map(FilledQuoteResponse::from)));
    }

    // ─── 호가 ────────────────────────────────────────────────────────────────

    @Operation(summary = "호가 조회", description = "매도/매수 각 10호가 잔량 조회.")
    @GetMapping("/hoga")
    public ResponseEntity<HogaResponse> getHoga(
            @Parameter(description = "종목코드", required = true, example = "005930")
            @RequestParam String symbol
    ) {
        return getQuoteUseCase.getHoga(symbol)
                .map(HogaResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── 투자동향 ────────────────────────────────────────────────────────────

    @Operation(summary = "일별 투자동향 조회 (순매수)",
               description = "외국인/개인/기관 순매수. 디폴트 100건, 최대 9999건.")
    @GetMapping("/trends")
    public ResponseEntity<PageResponse<InvestmentTrendResponse>> getTrends(
            @Parameter(description = "종목코드", required = true, example = "005930")
            @RequestParam String symbol,
            @Parameter(description = "조회건수 (기본 100, 최대 9999)", example = "100")
            @RequestParam(defaultValue = "100") int size,
            @Parameter(description = "페이지 커서 (첫 조회 시 생략)")
            @RequestParam(required = false) String cursor
    ) {
        return ResponseEntity.ok(PageResponse.from(
                getQuoteUseCase.getInvestmentTrends(symbol, size, cursor)
                        .map(InvestmentTrendResponse::from)));
    }

    // ─── 종목 상세 ───────────────────────────────────────────────────────────

    @Operation(summary = "종목 상세 조회",
               description = "시가총액/상장주식수/액면가/상하한가/52주고저/PER/EPS/PBR/BPS.")
    @GetMapping("/detail")
    public ResponseEntity<QuoteDetailResponse> getDetail(
            @Parameter(description = "종목코드", required = true, example = "005930")
            @RequestParam String symbol
    ) {
        return getQuoteUseCase.getDetail(symbol)
                .map(QuoteDetailResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
