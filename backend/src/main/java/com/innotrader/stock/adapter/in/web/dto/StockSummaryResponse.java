package com.innotrader.stock.adapter.in.web.dto;

import com.innotrader.stock.domain.model.StockMaster;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "종목 요약 응답")
public record StockSummaryResponse(
        @Schema(description = "종목명") String name,
        @Schema(description = "종목코드") String symbol,
        @Schema(description = "시장구분 (KOSPI|KOSDAQ)") String market
) {
    public static StockSummaryResponse from(StockMaster s) {
        return new StockSummaryResponse(s.name(), s.symbol(), s.market());
    }
}
