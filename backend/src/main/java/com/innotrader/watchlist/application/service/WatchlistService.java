package com.innotrader.watchlist.application.service;

import com.innotrader.common.annotation.UseCase;
import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;
import com.innotrader.stock.domain.model.StockMaster;
import com.innotrader.stock.domain.port.in.GetStockMasterUseCase;
import com.innotrader.watchlist.domain.model.WatchlistGroup;
import com.innotrader.watchlist.domain.port.in.WatchlistUseCase;
import com.innotrader.watchlist.domain.port.out.WatchlistPort;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * 관심그룹/관심종목 관리 애플리케이션 서비스.
 *
 * <ul>
 *   <li>그룹 등록 시 그룹코드 자동생성(사용자별 3자리 순번) 및 최대 100개 한도 검증</li>
 *   <li>종목 추가 시 그룹당 최대 100개 한도 검증</li>
 *   <li>변경 작업 후 갱신된 전체 그룹 목록(또는 단일 그룹) 반환</li>
 *   <li>기본 시드: 코스피100 / 코스닥100 / 랜덤50 (이름 기준 멱등)</li>
 * </ul>
 */
@UseCase
@Transactional
public class WatchlistService implements WatchlistUseCase {

    private static final long SEED = 20260618L; // 랜덤 그룹 결정적 시드

    private final WatchlistPort watchlistPort;
    private final GetStockMasterUseCase getStockMasterUseCase;

    public WatchlistService(WatchlistPort watchlistPort,
                            GetStockMasterUseCase getStockMasterUseCase) {
        this.watchlistPort = watchlistPort;
        this.getStockMasterUseCase = getStockMasterUseCase;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WatchlistGroup> listGroups(UUID userId) {
        return watchlistPort.findAllGroups(userId);
    }

    @Override
    public List<WatchlistGroup> createGroup(CreateGroupCommand command) {
        List<WatchlistGroup> groups = watchlistPort.findAllGroups(command.userId());
        if (groups.size() >= WatchlistGroup.MAX_GROUPS) {
            throw new BusinessException(ErrorCode.WATCHLIST_GROUP_LIMIT);
        }
        String code = nextGroupCode(groups);
        watchlistPort.save(WatchlistGroup.create(command.userId(), code, command.groupName()));
        return watchlistPort.findAllGroups(command.userId());
    }

    @Override
    public List<WatchlistGroup> renameGroup(RenameGroupCommand command) {
        WatchlistGroup group = loadGroup(command.userId(), command.groupCode());
        group.rename(command.groupName());
        watchlistPort.save(group);
        return watchlistPort.findAllGroups(command.userId());
    }

    @Override
    public List<WatchlistGroup> deleteGroup(DeleteGroupCommand command) {
        WatchlistGroup group = loadGroup(command.userId(), command.groupCode());
        watchlistPort.delete(group);
        return watchlistPort.findAllGroups(command.userId());
    }

    @Override
    @Transactional(readOnly = true)
    public WatchlistGroup getGroup(UUID userId, String groupCode) {
        return loadGroup(userId, groupCode);
    }

    @Override
    public WatchlistGroup addItems(ItemsCommand command) {
        WatchlistGroup group = loadGroup(command.userId(), command.groupCode());
        group.addSymbols(command.symbols());
        if (group.itemCount() > WatchlistGroup.MAX_ITEMS) {
            throw new BusinessException(ErrorCode.WATCHLIST_ITEM_LIMIT);
        }
        return watchlistPort.save(group);
    }

    @Override
    public WatchlistGroup removeItems(ItemsCommand command) {
        WatchlistGroup group = loadGroup(command.userId(), command.groupCode());
        group.removeSymbols(command.symbols());
        return watchlistPort.save(group);
    }

    // ─── 시드 ────────────────────────────────────────────────────────────────

    @Override
    public void seedDefaults(UUID userId) {
        // 초기화: 기존 관심그룹 전체 삭제 → 코드 001/002/003 보장
        for (WatchlistGroup g : watchlistPort.findAllGroups(userId)) {
            watchlistPort.delete(g);
        }
        createSeedGroup(userId, "관심그룹01", topByMarketCap("KOSPI", 100));
        createSeedGroup(userId, "관심그룹02", topByMarketCap("KOSDAQ", 100));
        createSeedGroup(userId, "관심그룹03", randomMix(25, 25));
    }

    private void createSeedGroup(UUID userId, String name, List<String> symbols) {
        String code = nextGroupCode(watchlistPort.findAllGroups(userId));
        WatchlistGroup group = WatchlistGroup.create(userId, code, name);
        group.addSymbols(symbols);
        watchlistPort.save(group);
    }

    /** 시장별 시가총액 상위 n개 종목코드. */
    private List<String> topByMarketCap(String market, int n) {
        return getStockMasterUseCase.getByMarket(market).stream()
                .sorted(Comparator.comparingLong(StockMaster::marketCap).reversed())
                .limit(n)
                .map(StockMaster::symbol)
                .toList();
    }

    /** 코스피 kospiN개 + 코스닥 kosdaqN개를 결정적 랜덤으로 선택. */
    private List<String> randomMix(int kospiN, int kosdaqN) {
        Random rng = new Random(SEED);
        List<String> result = new ArrayList<>();
        result.addAll(pickRandom(getStockMasterUseCase.getByMarket("KOSPI"), kospiN, rng));
        result.addAll(pickRandom(getStockMasterUseCase.getByMarket("KOSDAQ"), kosdaqN, rng));
        return result;
    }

    private List<String> pickRandom(List<StockMaster> list, int n, Random rng) {
        List<StockMaster> copy = new ArrayList<>(list);
        Collections.shuffle(copy, rng);
        return copy.stream().limit(n).map(StockMaster::symbol).toList();
    }

    // ─── 내부 ────────────────────────────────────────────────────────────────

    private WatchlistGroup loadGroup(UUID userId, String groupCode) {
        return watchlistPort.findGroup(userId, groupCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.WATCHLIST_GROUP_NOT_FOUND));
    }

    /** 기존 그룹코드 중 최대값 + 1 (사용자별 3자리 순번, 예: "001"). */
    private String nextGroupCode(List<WatchlistGroup> groups) {
        int max = 0;
        for (WatchlistGroup g : groups) {
            try {
                max = Math.max(max, Integer.parseInt(g.code()));
            } catch (NumberFormatException ignored) {
                // 비정상 코드는 무시
            }
        }
        return String.format("%03d", max + 1);
    }
}
