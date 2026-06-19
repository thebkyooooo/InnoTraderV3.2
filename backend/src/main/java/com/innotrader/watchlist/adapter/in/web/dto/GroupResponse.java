package com.innotrader.watchlist.adapter.in.web.dto;

import com.innotrader.watchlist.domain.model.WatchlistGroup;

/** 관심그룹 요약 응답 (그룹명/그룹코드/관심종목수). */
public record GroupResponse(String groupName, String groupCode, int itemCount) {

    public static GroupResponse from(WatchlistGroup group) {
        return new GroupResponse(group.name(), group.code(), group.itemCount());
    }
}
