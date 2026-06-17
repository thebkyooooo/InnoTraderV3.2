package com.innotrader.quote.adapter.in.web.dto;

import com.innotrader.quote.domain.model.CurrentPrice;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "현재가")
public record CurrentPriceResponse(
        @Schema(description = "종목코드")     String symbol,
        @Schema(description = "종목명")       String name,
        @Schema(description = "시장구분")     String market,
        @Schema(description = "현재가")       long   price,
        @Schema(description = "전일대비")     long   prevDiff,
        @Schema(description = "등락률(%)")    double change,
        @Schema(description = "거래량")       long   volume,
        @Schema(description = "시가")         long   open,
        @Schema(description = "고가")         long   high,
        @Schema(description = "저가")         long   low,
        @Schema(description = "전일종가")     long   prevClose,
        @Schema(description = "상한가")       long   upperLimit,
        @Schema(description = "하한가")       long   lowerLimit,
        @Schema(description = "거래대금(만원)") long tradingAmount
) {
    public static CurrentPriceResponse from(CurrentPrice c) {
        return new CurrentPriceResponse(
                c.symbol(), c.name(), c.market(),
                c.price(), c.prevDiff(), c.change(),
                c.volume(), c.open(), c.high(), c.low(),
                c.prevClose(), c.upperLimit(), c.lowerLimit(),
                c.tradingAmount()
        );
    }
}
