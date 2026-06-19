package com.innotrader.watchlist.domain.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * 관심그룹 Aggregate Root. 그룹 정보 + 관심종목(종목코드) 목록을 보유한다.
 *
 * <p>한도(그룹 최대 {@value #MAX_GROUPS}, 그룹당 종목 최대 {@value #MAX_ITEMS})는
 * 애플리케이션 서비스에서 검증한다.
 */
public final class WatchlistGroup {

    public static final int MAX_GROUPS = 100;
    public static final int MAX_ITEMS  = 100;

    private final UUID id;
    private final UUID userId;
    private final String code;
    private String name;
    private final List<String> symbols;

    private WatchlistGroup(UUID id, UUID userId, String code, String name, List<String> symbols) {
        this.id = id;
        this.userId = userId;
        this.code = code;
        this.name = name;
        this.symbols = symbols;
    }

    /** 신규 그룹 생성 (빈 종목). */
    public static WatchlistGroup create(UUID userId, String code, String name) {
        return new WatchlistGroup(UUID.randomUUID(), userId, code, name, new ArrayList<>());
    }

    /** 영속 데이터로부터 재구성. */
    public static WatchlistGroup reconstitute(UUID id, UUID userId, String code, String name, List<String> symbols) {
        return new WatchlistGroup(id, userId, code, name, new ArrayList<>(symbols));
    }

    public void rename(String name) {
        this.name = name;
    }

    /** 종목 추가 (중복·공백 무시). 한도 검증은 서비스에서 {@link #itemCount()}로 수행. */
    public void addSymbols(List<String> add) {
        for (String s : add) {
            if (s != null && !s.isBlank() && !symbols.contains(s)) {
                symbols.add(s);
            }
        }
    }

    public void removeSymbols(List<String> remove) {
        symbols.removeAll(remove);
    }

    public int itemCount() {
        return symbols.size();
    }

    public UUID id()              { return id; }
    public UUID userId()          { return userId; }
    public String code()          { return code; }
    public String name()          { return name; }
    public List<String> symbols() { return Collections.unmodifiableList(symbols); }
}
