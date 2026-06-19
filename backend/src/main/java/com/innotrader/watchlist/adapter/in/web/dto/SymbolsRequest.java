package com.innotrader.watchlist.adapter.in.web.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** 관심종목 추가/삭제 요청 (종목코드 복수). */
public record SymbolsRequest(
        @NotEmpty List<String> symbols
) {}
