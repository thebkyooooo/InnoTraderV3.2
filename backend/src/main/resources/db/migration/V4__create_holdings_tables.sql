-- =============================================================================
-- V4: Create holdings table (계좌잔고 / 보유종목)
-- =============================================================================

CREATE TABLE holdings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id),
    account_no VARCHAR(30) NOT NULL,
    symbol     VARCHAR(20) NOT NULL,
    quantity   BIGINT      NOT NULL,
    avg_price  BIGINT      NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_holding UNIQUE (user_id, account_no, symbol)
);

CREATE INDEX idx_holdings_user_account ON holdings (user_id, account_no);
