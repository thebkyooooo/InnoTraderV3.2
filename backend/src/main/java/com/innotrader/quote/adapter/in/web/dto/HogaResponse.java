package com.innotrader.quote.adapter.in.web.dto;

import com.innotrader.quote.domain.model.HogaData;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "호가 응답")
public record HogaResponse(
        @Schema(description = "매도호가 목록 (1~10호가, 낮은 가격순)") List<HogaEntryDto> asks,
        @Schema(description = "매수호가 목록 (1~10호가, 높은 가격순)") List<HogaEntryDto> bids
) {
    public static HogaResponse from(HogaData d) {
        return new HogaResponse(
                d.asks().stream().map(HogaEntryDto::from).toList(),
                d.bids().stream().map(HogaEntryDto::from).toList()
        );
    }
}
