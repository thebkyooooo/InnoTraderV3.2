package com.innotrader.watchlist.adapter.out.persistence;

import com.innotrader.common.annotation.PersistenceAdapter;
import com.innotrader.watchlist.domain.model.WatchlistGroup;
import com.innotrader.watchlist.domain.port.out.WatchlistPort;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Persistence adapter implementing {@link WatchlistPort}.
 *
 * <p>그룹/종목 두 테이블을 조합해 도메인 {@link WatchlistGroup} 으로 변환한다.
 * 종목은 도메인의 최종 상태로 전체 교체(delete-all + insert)한다.
 */
@PersistenceAdapter
public class WatchlistPersistenceAdapter implements WatchlistPort {

    private final WatchlistGroupJpaRepository groupRepository;
    private final WatchlistItemJpaRepository itemRepository;

    public WatchlistPersistenceAdapter(WatchlistGroupJpaRepository groupRepository,
                                       WatchlistItemJpaRepository itemRepository) {
        this.groupRepository = groupRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    public List<WatchlistGroup> findAllGroups(UUID userId) {
        return groupRepository.findByUserIdOrderByGroupCodeAsc(userId).stream()
                .map(g -> toDomain(g, symbolsOf(g.getId())))
                .toList();
    }

    @Override
    public Optional<WatchlistGroup> findGroup(UUID userId, String groupCode) {
        return groupRepository.findByUserIdAndGroupCode(userId, groupCode)
                .map(g -> toDomain(g, symbolsOf(g.getId())));
    }

    @Override
    public WatchlistGroup save(WatchlistGroup group) {
        WatchlistGroupJpaEntity entity = groupRepository.findById(group.id())
                .map(existing -> { existing.updateName(group.name()); return existing; })
                .orElseGet(() -> WatchlistGroupJpaEntity.fromDomain(group));
        groupRepository.save(entity);

        // 종목 전체 교체 (도메인이 최종 상태를 보유)
        itemRepository.deleteByGroupId(group.id());
        for (String symbol : group.symbols()) {
            itemRepository.save(WatchlistItemJpaEntity.of(group.id(), symbol));
        }
        return toDomain(entity, List.copyOf(group.symbols()));
    }

    @Override
    public void delete(WatchlistGroup group) {
        itemRepository.deleteByGroupId(group.id());
        groupRepository.deleteById(group.id());
    }

    // ─── 변환 ────────────────────────────────────────────────────────────────

    private List<String> symbolsOf(UUID groupId) {
        return itemRepository.findByGroupIdOrderByCreatedAtAsc(groupId).stream()
                .map(WatchlistItemJpaEntity::getSymbol)
                .toList();
    }

    private WatchlistGroup toDomain(WatchlistGroupJpaEntity g, List<String> symbols) {
        return WatchlistGroup.reconstitute(g.getId(), g.getUserId(), g.getGroupCode(), g.getGroupName(), symbols);
    }
}
