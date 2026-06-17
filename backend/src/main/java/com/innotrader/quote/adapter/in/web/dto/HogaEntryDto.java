package com.innotrader.quote.adapter.in.web.dto;

import com.innotrader.quote.domain.model.HogaEntry;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "호가 항목")
public record HogaEntryDto(
        @Schema(description = "호가") long price,
        @Schema(description = "잔량") long volume
) {
    public static HogaEntryDto from(HogaEntry e) {
        return new HogaEntryDto(e.price(), e.volume());
    }
}
