package com.innotrader.watchlist.adapter.out.persistence;

import com.innotrader.common.domain.BaseEntity;
import com.innotrader.watchlist.domain.model.WatchlistGroup;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

/**
 * JPA entity for the {@code watchlist_groups} table.
 */
@Entity
@Table(name = "watchlist_groups")
public class WatchlistGroupJpaEntity extends BaseEntity {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "group_code", nullable = false, length = 20)
    private String groupCode;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    protected WatchlistGroupJpaEntity() {}

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getGroupCode() { return groupCode; }
    public String getGroupName() { return groupName; }

    private WatchlistGroupJpaEntity(UUID id, UUID userId, String groupCode, String groupName) {
        this.id = id;
        this.userId = userId;
        this.groupCode = groupCode;
        this.groupName = groupName;
    }

    public void updateName(String groupName) {
        this.groupName = groupName;
    }

    public static WatchlistGroupJpaEntity fromDomain(WatchlistGroup group) {
        return new WatchlistGroupJpaEntity(group.id(), group.userId(), group.code(), group.name());
    }
}
