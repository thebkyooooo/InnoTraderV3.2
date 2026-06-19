-- =============================================================================
-- V5: Create stock_orders table (계좌주문 / 매수·매도·정정·취소·주문내역)
--
-- 주의: V1의 `orders`(초기 코어 스키마: account_id/idempotency_key 기반)와 충돌하지 않도록
--      별도 테이블명 `stock_orders`를 사용한다. (account 컨텍스트가 securities_accounts를
--      별도 생성한 것과 동일한 분리 전략)
-- =============================================================================

CREATE TABLE stock_orders (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES users(id),
    account_no        VARCHAR(30) NOT NULL,
    order_no          VARCHAR(30) NOT NULL,
    original_order_no VARCHAR(30),
    symbol            VARCHAR(20) NOT NULL,
    side              VARCHAR(10) NOT NULL,   -- BUY | SELL
    order_type        VARCHAR(10) NOT NULL,   -- MARKET | LIMIT
    quantity          BIGINT      NOT NULL,
    price             BIGINT      NOT NULL,
    status            VARCHAR(20) NOT NULL,   -- RECEIVED | PARTIAL | FILLED | CANCELED | AMENDED | CANCEL_DONE
    filled_quantity   BIGINT      NOT NULL DEFAULT 0,
    filled_price      BIGINT      NOT NULL DEFAULT 0,
    ordered_at        TIMESTAMPTZ NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_stock_order_no UNIQUE (order_no)
);

CREATE INDEX idx_stock_orders_user_account ON stock_orders (user_id, account_no);
CREATE INDEX idx_stock_orders_ordered_at   ON stock_orders (user_id, account_no, ordered_at DESC);
