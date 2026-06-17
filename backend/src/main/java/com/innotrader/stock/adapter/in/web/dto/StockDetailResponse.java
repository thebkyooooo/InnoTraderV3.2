package com.innotrader.stock.adapter.in.web.dto;

import com.innotrader.stock.domain.model.StockMaster;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "종목 상세 응답")
public record StockDetailResponse(
        @Schema(description = "종목명") String name,
        @Schema(description = "종목코드") String symbol,
        @Schema(description = "시장구분 (KOSPI|KOSDAQ)") String market,
        @Schema(description = "종가") long price,
        @Schema(description = "전일대비") long prevDiff,
        @Schema(description = "등락률(%)") double change,
        @Schema(description = "시가") long open,
        @Schema(description = "고가") long high,
        @Schema(description = "저가") long low,
        @Schema(description = "거래량") long volume,
        @Schema(description = "거래금액(만)") long turnoverMan
) {
    public static StockDetailResponse from(StockMaster s) {
        return new StockDetailResponse(
                s.name(), s.symbol(), s.market(),
                s.price(), s.prevDiff(), s.change(),
                s.open(), s.high(), s.low(),
                s.volume(), s.turnoverMan()
        );
    }
}
