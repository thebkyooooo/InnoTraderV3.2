package com.innotrader.quote.adapter.in.web.dto;

import com.innotrader.quote.domain.port.in.GetQuoteUseCase.QuotePage;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "페이징 응답")
public record PageResponse<T>(
        @Schema(description = "데이터 목록") List<T> items,
        @Schema(description = "다음 페이지 커서 (null 이면 마지막 페이지)") String nextCursor,
        @Schema(description = "다음 페이지 존재 여부") boolean hasNext
) {
    public static <T> PageResponse<T> from(QuotePage<T> page) {
        return new PageResponse<>(page.items(), page.nextCursor(), page.hasNext());
    }
}
