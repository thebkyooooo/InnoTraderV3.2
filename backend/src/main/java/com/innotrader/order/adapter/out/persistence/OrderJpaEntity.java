package com.innotrader.order.adapter.out.persistence;

import com.innotrader.common.domain.BaseEntity;
import com.innotrader.order.domain.model.Order;
import com.innotrader.order.domain.model.OrderSide;
import com.innotrader.order.domain.model.OrderStatus;
import com.innotrader.order.domain.model.OrderType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for the {@code orders} table.
 */
@Entity
@Table(name = "stock_orders")
public class OrderJpaEntity extends BaseEntity {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_no", nullable = false, length = 30)
    private String accountNo;

    @Column(name = "order_no", nullable = false, length = 30)
    private String orderNo;

    @Column(name = "original_order_no", length = 30)
    private String originalOrderNo;

    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "side", nullable = false, length = 10)
    private OrderSide side;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 10)
    private OrderType orderType;

    @Column(name = "quantity", nullable = false)
    private long quantity;

    @Column(name = "price", nullable = false)
    private long price;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status;

    @Column(name = "filled_quantity", nullable = false)
    private long filledQuantity;

    @Column(name = "filled_price", nullable = false)
    private long filledPrice;

    @Column(name = "ordered_at", nullable = false)
    private Instant orderedAt;

    protected OrderJpaEntity() {}

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getAccountNo() { return accountNo; }
    public String getOrderNo() { return orderNo; }
    public String getOriginalOrderNo() { return originalOrderNo; }
    public String getSymbol() { return symbol; }
    public OrderSide getSide() { return side; }
    public OrderType getOrderType() { return orderType; }
    public long getQuantity() { return quantity; }
    public long getPrice() { return price; }
    public OrderStatus getStatus() { return status; }
    public long getFilledQuantity() { return filledQuantity; }
    public long getFilledPrice() { return filledPrice; }
    public Instant getOrderedAt() { return orderedAt; }

    private OrderJpaEntity(UUID id, UUID userId, String accountNo, String orderNo, String originalOrderNo,
                           String symbol, OrderSide side, OrderType orderType, long quantity, long price,
                           OrderStatus status, long filledQuantity, long filledPrice, Instant orderedAt) {
        this.id = id;
        this.userId = userId;
        this.accountNo = accountNo;
        this.orderNo = orderNo;
        this.originalOrderNo = originalOrderNo;
        this.symbol = symbol;
        this.side = side;
        this.orderType = orderType;
        this.quantity = quantity;
        this.price = price;
        this.status = status;
        this.filledQuantity = filledQuantity;
        this.filledPrice = filledPrice;
        this.orderedAt = orderedAt;
    }

    public Order toDomain() {
        return new Order(id, userId, accountNo, orderNo, originalOrderNo,
                symbol, side, orderType, quantity, price, status, filledQuantity, filledPrice, orderedAt);
    }

    public static OrderJpaEntity fromDomain(Order o) {
        return new OrderJpaEntity(o.id(), o.userId(), o.accountNo(), o.orderNo(), o.originalOrderNo(),
                o.symbol(), o.side(), o.orderType(), o.quantity(), o.price(),
                o.status(), o.filledQuantity(), o.filledPrice(), o.orderedAt());
    }
}
