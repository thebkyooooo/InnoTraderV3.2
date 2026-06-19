-- =============================================================================
-- V3: Create securities account table (계좌내역)
-- =============================================================================

CREATE TABLE securities_accounts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users(id),
    account_no       VARCHAR(30)  NOT NULL,
    account_name     VARCHAR(100) NOT NULL,
    type_code        VARCHAR(10)  NOT NULL,
    type_name        VARCHAR(50)  NOT NULL,
    orderable_amount BIGINT       NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_securities_account UNIQUE (user_id, account_no)
);

CREATE INDEX idx_securities_accounts_user ON securities_accounts (user_id);
