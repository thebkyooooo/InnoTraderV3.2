-- =============================================================================
-- V2: Create watchlist tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- watchlist_groups (관심그룹)
-- -----------------------------------------------------------------------------
CREATE TABLE watchlist_groups (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id),
    group_code VARCHAR(20)  NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_watchlist_group_code UNIQUE (user_id, group_code)
);

-- -----------------------------------------------------------------------------
-- watchlist_items (관심종목)
-- -----------------------------------------------------------------------------
CREATE TABLE watchlist_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id   UUID        NOT NULL REFERENCES watchlist_groups(id) ON DELETE CASCADE,
    symbol     VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_watchlist_item UNIQUE (group_id, symbol)
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_watchlist_groups_user ON watchlist_groups (user_id);
CREATE INDEX idx_watchlist_items_group ON watchlist_items (group_id);
