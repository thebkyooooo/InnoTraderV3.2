package com.innotrader.market.adapter.in.web.dto;

import com.innotrader.market.domain.model.IndexInfo;

public record IndexInfoResponse(
        String code,
        String name,
        double price,
        double prevDiff,
        double change
) {
    public static IndexInfoResponse from(IndexInfo i) {
        return new IndexInfoResponse(i.code(), i.name(), i.price(), i.prevDiff(), i.change());
    }
}
