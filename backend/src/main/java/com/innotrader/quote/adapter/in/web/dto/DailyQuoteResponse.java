package com.innotrader.quote.adapter.in.web.dto;

import com.innotrader.quote.domain.model.DailyQuote;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "일별 시세")
public record DailyQuoteResponse(
        @Schema(description = "일자 (yyyyMMdd)") String date,
        @Schema(description = "종가") long price,
        @Schema(description = "전일대비") long prevDiff,
        @Schema(description = "등락률(%)") double change,
        @Schema(description = "시가") long open,
        @Schema(description = "고가") long high,
        @Schema(description = "저가") long low,
        @Schema(description = "거래량") long volume,
        @Schema(description = "거래금액(만)") long turnoverMan
) {
    public static DailyQuoteResponse from(DailyQuote q) {
        return new DailyQuoteResponse(q.date(), q.price(), q.prevDiff(), q.change(),
                q.open(), q.high(), q.low(), q.volume(), q.turnoverMan());
    }
}
