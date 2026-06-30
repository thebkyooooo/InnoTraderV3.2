package com.innotrader.watchlist.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA entity for the {@code watchlist_items} table.
 *
 * <p>{@code created_at} is DB-managed (default now()) and read-only here, used for stable ordering.
 */
@Entity
@Table(name = "watchlist_items")
public class WatchlistItemJpaEntity {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    protected WatchlistItemJpaEntity() {}

    public UUID getId() { return id; }
    public UUID getGroupId() { return groupId; }
    public String getSymbol() { return symbol; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    private WatchlistItemJpaEntity(UUID id, UUID groupId, String symbol) {
        this.id = id;
        this.groupId = groupId;
        this.symbol = symbol;
    }

    public static WatchlistItemJpaEntity of(UUID groupId, String symbol) {
        return new WatchlistItemJpaEntity(UUID.randomUUID(), groupId, symbol);
    }
}
