package com.innotrader.quote.domain.model;

import java.util.List;

public record HogaData(
        List<HogaEntry> asks, // 매도호가 (낮은 가격 → 높은 가격, 1~10)
        List<HogaEntry> bids  // 매수호가 (높은 가격 → 낮은 가격, 1~10)
) {}
