package com.innotrader.chart.adapter.in.web;

import com.innotrader.chart.adapter.in.web.dto.DailyChartResponse;
import com.innotrader.chart.adapter.in.web.dto.PageResponse;
import com.innotrader.chart.adapter.in.web.dto.TimeChartResponse;
import com.innotrader.chart.domain.port.in.GetChartUseCase;
import com.innotrader.chart.domain.port.in.GetChartUseCase.DailyType;
import com.innotrader.chart.domain.port.in.GetChartUseCase.TimeType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 차트 시세 공개 API — 인증 불필요.
 *
 * <ul>
 *   <li>GET /api/public/chart/daily — 일별 차트 (일봉/주봉/월봉/년봉)</li>
 *   <li>GET /api/public/chart/time  — 분별 차트 (1분/5분/10분/30분/60분)</li>
 * </ul>
 */
@Tag(name = "차트시세", description = "차트 시세 공개 API (인증 불필요)")
@RestController
@RequestMapping("/api/public/chart")
public class ChartController {

    private final GetChartUseCase getChartUseCase;

    public ChartController(GetChartUseCase getChartUseCase) {
        this.getChartUseCase = getChartUseCase;
    }

    // ─── 일별 차트 ────────────────────────────────────────────────────────────

    @Operation(summary = "일별 차트 시세 조회",
               description = "일봉(D)/주봉(W)/월봉(M)/년봉(Y). 디폴트: D=360, W=360, M=72, Y=47. 최대 9999건.")
    @GetMapping("/daily")
    public ResponseEntity<PageResponse<DailyChartResponse>> getDaily(
            @Parameter(description = "종목코드", required = true, example = "005930")
            @RequestParam String symbol,
            @Parameter(description = "조회구분 (D/W/M/Y)", example = "D")
            @RequestParam(defaultValue = "D") String type,
            @Parameter(description = "조회건수 (최대 9999, 생략 시 타입별 기본값)")
            @RequestParam(required = false) Integer size,
            @Parameter(description = "페이지 커서 (첫 조회 시 생략)")
            @RequestParam(required = false) String cursor
    ) {
        DailyType dailyType    = parseDailyType(type);
        int       resolvedSize = size != null ? size : defaultDailySize(dailyType);

        return ResponseEntity.ok(PageResponse.from(
                getChartUseCase.getDailyChart(symbol, dailyType, resolvedSize, cursor)
                               .map(DailyChartResponse::from)));
    }

    // ─── 분별 차트 ────────────────────────────────────────────────────────────

    @Operation(summary = "분별 차트 시세 조회",
               description = "1분/5분/10분/30분/60분. 디폴트 360건. 최대 9999건.")
    @GetMapping("/time")
    public ResponseEntity<PageResponse<TimeChartResponse>> getTime(
            @Parameter(description = "종목코드", required = true, example = "005930")
            @RequestParam String symbol,
            @Parameter(description = "조회구분 (분 단위: 1/5/10/30/60)", example = "1")
            @RequestParam(defaultValue = "1") int type,
            @Parameter(description = "조회건수 (기본 360, 최대 9999)", example = "360")
            @RequestParam(defaultValue = "360") int size,
            @Parameter(description = "페이지 커서 (첫 조회 시 생략)")
            @RequestParam(required = false) String cursor
    ) {
        return ResponseEntity.ok(PageResponse.from(
                getChartUseCase.getTimeChart(symbol, TimeType.of(type), size, cursor)
                               .map(TimeChartResponse::from)));
    }

    // ─── 유틸 ────────────────────────────────────────────────────────────────

    private DailyType parseDailyType(String type) {
        return switch (type.toUpperCase()) {
            case "W" -> DailyType.W;
            case "M" -> DailyType.M;
            case "Y" -> DailyType.Y;
            default  -> DailyType.D;
        };
    }

    private int defaultDailySize(DailyType type) {
        return switch (type) {
            case D, W -> 360;
            case M    -> 72;
            case Y    -> 47;
        };
    }
}
