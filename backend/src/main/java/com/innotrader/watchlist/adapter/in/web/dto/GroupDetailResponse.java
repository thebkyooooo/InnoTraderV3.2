package com.innotrader.watchlist.adapter.in.web.dto;

import com.innotrader.watchlist.domain.model.WatchlistGroup;

import java.util.List;

/** 관심종목 조회 응답 (그룹명/그룹코드/관심종목수 + 종목 목록). */
public record GroupDetailResponse(
        String groupName,
        String groupCode,
        int itemCount,
        List<WatchlistItemResponse> items
) {
    public static GroupDetailResponse of(WatchlistGroup group, List<WatchlistItemResponse> items) {
        return new GroupDetailResponse(group.name(), group.code(), group.itemCount(), items);
    }
}
