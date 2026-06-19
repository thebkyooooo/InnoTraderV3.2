package com.innotrader.order.domain.model;

/**
 * 주문상태.
 *
 * <ul>
 *   <li>{@link #RECEIVED} 접수 — 미체결(체결수량 0)</li>
 *   <li>{@link #PARTIAL}  부분체결</li>
 *   <li>{@link #FILLED}   전체체결</li>
 *   <li>{@link #CANCELED} 취소 — 원주문이 취소된 상태</li>
 *   <li>{@link #AMENDED}  정정완료 — 정정 접수증</li>
 *   <li>{@link #CANCEL_DONE} 취소완료 — 취소 접수증</li>
 * </ul>
 */
public enum OrderStatus {
    RECEIVED("접수"),
    PARTIAL("부분체결"),
    FILLED("전체체결"),
    CANCELED("취소"),
    AMENDED("정정완료"),
    CANCEL_DONE("취소완료");

    private final String label;

    OrderStatus(String label) {
        this.label = label;
    }

    public String code() { return name(); }

    public String label() { return label; }
}
