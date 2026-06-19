package com.innotrader.order.domain.model;

import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;

/**
 * 주문구분 (매수/매도).
 */
public enum OrderSide {
    BUY("buy", "매수"),
    SELL("sell", "매도");

    private final String code;
    private final String label;

    OrderSide(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String code() { return code; }

    public String label() { return label; }

    /** "buy"/"sell" 또는 "BUY"/"SELL" 파싱. */
    public static OrderSide from(String value) {
        if (value != null) {
            for (OrderSide s : values()) {
                if (s.code.equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) {
                    return s;
                }
            }
        }
        throw new BusinessException(ErrorCode.INVALID_INPUT, "주문구분이 올바르지 않습니다: " + value);
    }
}
