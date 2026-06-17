-- =============================================================================
-- V1: Create core tables for InnoTrader
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role          VARCHAR(50)  NOT NULL DEFAULT 'ROLE_USER',
    status        VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- accounts
-- -----------------------------------------------------------------------------
CREATE TABLE accounts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL REFERENCES users(id),
    balance           NUMERIC(20,2) NOT NULL DEFAULT 0,
    available_balance NUMERIC(20,2) NOT NULL DEFAULT 0,
    currency          VARCHAR(10)  NOT NULL DEFAULT 'KRW',
    version           BIGINT       NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- instruments
-- -----------------------------------------------------------------------------
CREATE TABLE instruments (
    symbol     VARCHAR(20)   PRIMARY KEY,
    name       VARCHAR(255)  NOT NULL,
    market     VARCHAR(50),
    tick_size  NUMERIC(20,8),
    lot_size   INTEGER       NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id       UUID          NOT NULL REFERENCES accounts(id),
    symbol           VARCHAR(20)   NOT NULL REFERENCES instruments(symbol),
    side             VARCHAR(10)   NOT NULL,
    type             VARCHAR(20)   NOT NULL,
    price            NUMERIC(20,2),
    quantity         NUMERIC(20,8) NOT NULL,
    filled_quantity  NUMERIC(20,8) NOT NULL DEFAULT 0,
    status           VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    idempotency_key  VARCHAR(255)  UNIQUE,
    version          BIGINT        NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- executions
-- -----------------------------------------------------------------------------
CREATE TABLE executions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID          NOT NULL REFERENCES orders(id),
    exec_price    NUMERIC(20,2) NOT NULL,
    exec_quantity NUMERIC(20,8) NOT NULL,
    executed_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- positions
-- -----------------------------------------------------------------------------
CREATE TABLE positions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID          NOT NULL REFERENCES accounts(id),
    symbol     VARCHAR(20)   NOT NULL,
    quantity   NUMERIC(20,8) NOT NULL DEFAULT 0,
    avg_price  NUMERIC(20,2),
    version    BIGINT        NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_position UNIQUE (account_id, symbol)
);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id),
    type       VARCHAR(50),
    payload    JSONB,
    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- orders: frequent queries by account + status sorted by creation time
CREATE INDEX idx_orders_account_status_created
    ON orders (account_id, status, created_at DESC);

-- orders: market-data / matching engine lookups by symbol
CREATE INDEX idx_orders_symbol
    ON orders (symbol);

-- positions: portfolio lookups by account
CREATE INDEX idx_positions_account_id
    ON positions (account_id);
