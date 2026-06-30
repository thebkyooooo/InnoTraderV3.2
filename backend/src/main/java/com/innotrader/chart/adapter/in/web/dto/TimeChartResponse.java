package com.innotrader.chart.adapter.in.web.dto;

import com.innotrader.chart.domain.model.TimeChart;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "분별 차트 시세")
public record TimeChartResponse(
        @Schema(description = "거래일 (yyyyMMdd)") String date,
        @Schema(description = "시간 (HHmmss)")    String time,
        @Schema(description = "체결가")            long   price,
        @Schema(description = "전일대비")          long   prevDiff,
        @Schema(description = "등락률(%)")         double change,
        @Schema(description = "시가")             long   open,
        @Schema(description = "고가")             long   high,
        @Schema(description = "저가")             long   low,
        @Schema(description = "체결량")            long   filledVolume,
        @Schema(description = "거래량(누적)")       long   volume
) {
    public static TimeChartResponse from(TimeChart c) {
        return new TimeChartResponse(c.date(), c.time(), c.price(), c.prevDiff(), c.change(),
                c.open(), c.high(), c.low(), c.filledVolume(), c.volume());
    }
}
