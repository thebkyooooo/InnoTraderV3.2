package com.innotrader.quote.adapter.in.web.dto;

import com.innotrader.quote.domain.model.InvestmentTrend;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "투자동향 (순매수)")
public record InvestmentTrendResponse(
        @Schema(description = "일자 (yyyyMMdd)") String date,
        @Schema(description = "종가") long price,
        @Schema(description = "전일대비") long prevDiff,
        @Schema(description = "등락률(%)") double change,
        @Schema(description = "거래량") long volume,
        @Schema(description = "외국인 순매수") long foreign,
        @Schema(description = "개인 순매수") long individual,
        @Schema(description = "기관 순매수") long institution
) {
    public static InvestmentTrendResponse from(InvestmentTrend t) {
        return new InvestmentTrendResponse(t.date(), t.price(), t.prevDiff(), t.change(),
                t.volume(), t.foreign(), t.individual(), t.institution());
    }
}
