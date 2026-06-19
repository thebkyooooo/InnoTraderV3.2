package com.innotrader.order.domain.model;

import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;

/**
 * 주문유형 (시장가/지정가).
 */
public enum OrderType {
    MARKET("시장가"),
    LIMIT("지정가");

    private final String label;

    OrderType(String label) {
        this.label = label;
    }

    public String code() { return name(); }

    public String label() { return label; }

    /** "MARKET"/"LIMIT" 또는 한글("시장가"/"지정가") 파싱. */
    public static OrderType from(String value) {
        if (value != null) {
            for (OrderType t : values()) {
                if (t.name().equalsIgnoreCase(value) || t.label.equals(value)) {
                    return t;
                }
            }
        }
        throw new BusinessException(ErrorCode.INVALID_INPUT, "주문유형이 올바르지 않습니다: " + value);
    }
}
