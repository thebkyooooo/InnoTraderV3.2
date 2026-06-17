package com.innotrader.quote.adapter.in.web.dto;

import com.innotrader.quote.domain.model.FilledQuote;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "체결 시세")
public record FilledQuoteResponse(
        @Schema(description = "시간 (HHmmss)") String time,
        @Schema(description = "현재가") long price,
        @Schema(description = "전일대비") long prevDiff,
        @Schema(description = "등락률(%)") double change,
        @Schema(description = "매도호가") long askPrice,
        @Schema(description = "매수호가") long bidPrice,
        @Schema(description = "체결량") long filledVolume,
        @Schema(description = "체결강도") double fillStrength,
        @Schema(description = "누적거래량") long volume
) {
    public static FilledQuoteResponse from(FilledQuote q) {
        return new FilledQuoteResponse(q.time(), q.price(), q.prevDiff(), q.change(),
                q.askPrice(), q.bidPrice(), q.filledVolume(), q.fillStrength(), q.volume());
    }
}
