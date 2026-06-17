package com.innotrader.quote.adapter.in.web.dto;

import com.innotrader.quote.domain.model.QuoteDetail;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "종목 상세")
public record QuoteDetailResponse(
        @Schema(description = "종목명") String name,
        @Schema(description = "종목코드") String symbol,
        @Schema(description = "시가총액(만)") long marketCap,
        @Schema(description = "상장주식수") long lstdShrs,
        @Schema(description = "액면가") long parValue,
        @Schema(description = "상한가") long upperLimit,
        @Schema(description = "하한가") long lowerLimit,
        @Schema(description = "52주 최고") long high52w,
        @Schema(description = "52주 최저") long low52w,
        @Schema(description = "PER") double per,
        @Schema(description = "EPS") long eps,
        @Schema(description = "PBR") double pbr,
        @Schema(description = "BPS") long bps
) {
    public static QuoteDetailResponse from(QuoteDetail d) {
        return new QuoteDetailResponse(d.name(), d.symbol(), d.marketCap(), d.lstdShrs(),
                d.parValue(), d.upperLimit(), d.lowerLimit(), d.high52w(), d.low52w(),
                d.per(), d.eps(), d.pbr(), d.bps());
    }
}
