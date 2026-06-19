package com.innotrader.watchlist.adapter.in.web;

import com.innotrader.common.security.JwtUserDetails;
import com.innotrader.stock.domain.model.StockMaster;
import com.innotrader.stock.domain.port.in.GetStockMasterUseCase;
import com.innotrader.watchlist.adapter.in.web.dto.CreateGroupRequest;
import com.innotrader.watchlist.adapter.in.web.dto.GroupDetailResponse;
import com.innotrader.watchlist.adapter.in.web.dto.GroupResponse;
import com.innotrader.watchlist.adapter.in.web.dto.SymbolsRequest;
import com.innotrader.watchlist.adapter.in.web.dto.UpdateGroupRequest;
import com.innotrader.watchlist.adapter.in.web.dto.WatchlistItemResponse;
import com.innotrader.watchlist.domain.model.WatchlistGroup;
import com.innotrader.watchlist.domain.port.in.WatchlistUseCase;
import com.innotrader.watchlist.domain.port.in.WatchlistUseCase.CreateGroupCommand;
import com.innotrader.watchlist.domain.port.in.WatchlistUseCase.DeleteGroupCommand;
import com.innotrader.watchlist.domain.port.in.WatchlistUseCase.ItemsCommand;
import com.innotrader.watchlist.domain.port.in.WatchlistUseCase.RenameGroupCommand;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST inbound adapter for 관심종목(watchlist) — 인증 필요 ({@code /api/private/watchlist}).
 *
 * <p>사용자ID는 JWT 액세스 토큰({@link JwtUserDetails})에서 추출하며, 클라이언트가
 * 전달한 값을 신뢰하지 않는다(본인 관심종목만 관리 가능).
 *
 * <ul>
 *   <li>{@code GET    /groups}                — 관심그룹 조회</li>
 *   <li>{@code POST   /groups}                — 관심그룹 등록</li>
 *   <li>{@code PUT    /groups/{code}}         — 관심그룹 변경</li>
 *   <li>{@code DELETE /groups/{code}}         — 관심그룹 삭제</li>
 *   <li>{@code GET    /groups/{code}/items}   — 관심종목 조회</li>
 *   <li>{@code POST   /groups/{code}/items}   — 관심종목 추가</li>
 *   <li>{@code DELETE /groups/{code}/items}   — 관심종목 삭제</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/private/watchlist")
public class WatchlistController {

    private final WatchlistUseCase watchlistUseCase;
    private final GetStockMasterUseCase getStockMasterUseCase;

    public WatchlistController(WatchlistUseCase watchlistUseCase,
                              GetStockMasterUseCase getStockMasterUseCase) {
        this.watchlistUseCase = watchlistUseCase;
        this.getStockMasterUseCase = getStockMasterUseCase;
    }

    // ─── 관심그룹 ─────────────────────────────────────────────────────────────

    @GetMapping("/groups")
    public ResponseEntity<List<GroupResponse>> listGroups(@AuthenticationPrincipal JwtUserDetails principal) {
        return ResponseEntity.ok(toGroupResponses(watchlistUseCase.listGroups(userId(principal))));
    }

    @PostMapping("/groups")
    public ResponseEntity<List<GroupResponse>> createGroup(@AuthenticationPrincipal JwtUserDetails principal,
                                                          @Valid @RequestBody CreateGroupRequest request) {
        List<WatchlistGroup> groups = watchlistUseCase.createGroup(
                new CreateGroupCommand(userId(principal), request.groupName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toGroupResponses(groups));
    }

    /** 기본 관심그룹으로 초기화 — 기존 그룹 전체 삭제 후 코스피100/코스닥100/랜덤50을 코드 001/002/003으로 재생성. */
    @PostMapping("/seed")
    public ResponseEntity<List<GroupResponse>> seedDefaults(@AuthenticationPrincipal JwtUserDetails principal) {
        UUID uid = userId(principal);
        watchlistUseCase.seedDefaults(uid);
        return ResponseEntity.ok(toGroupResponses(watchlistUseCase.listGroups(uid)));
    }

    @PutMapping("/groups/{groupCode}")
    public ResponseEntity<List<GroupResponse>> renameGroup(@AuthenticationPrincipal JwtUserDetails principal,
                                                          @PathVariable String groupCode,
                                                          @Valid @RequestBody UpdateGroupRequest request) {
        List<WatchlistGroup> groups = watchlistUseCase.renameGroup(
                new RenameGroupCommand(userId(principal), groupCode, request.groupName()));
        return ResponseEntity.ok(toGroupResponses(groups));
    }

    @DeleteMapping("/groups/{groupCode}")
    public ResponseEntity<List<GroupResponse>> deleteGroup(@AuthenticationPrincipal JwtUserDetails principal,
                                                          @PathVariable String groupCode) {
        List<WatchlistGroup> groups = watchlistUseCase.deleteGroup(
                new DeleteGroupCommand(userId(principal), groupCode));
        return ResponseEntity.ok(toGroupResponses(groups));
    }

    // ─── 관심종목 ─────────────────────────────────────────────────────────────

    @GetMapping("/groups/{groupCode}/items")
    public ResponseEntity<GroupDetailResponse> getItems(@AuthenticationPrincipal JwtUserDetails principal,
                                                       @PathVariable String groupCode) {
        return ResponseEntity.ok(toDetail(watchlistUseCase.getGroup(userId(principal), groupCode)));
    }

    @PostMapping("/groups/{groupCode}/items")
    public ResponseEntity<GroupDetailResponse> addItems(@AuthenticationPrincipal JwtUserDetails principal,
                                                       @PathVariable String groupCode,
                                                       @Valid @RequestBody SymbolsRequest request) {
        WatchlistGroup group = watchlistUseCase.addItems(
                new ItemsCommand(userId(principal), groupCode, request.symbols()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDetail(group));
    }

    @DeleteMapping("/groups/{groupCode}/items")
    public ResponseEntity<GroupDetailResponse> removeItems(@AuthenticationPrincipal JwtUserDetails principal,
                                                          @PathVariable String groupCode,
                                                          @Valid @RequestBody SymbolsRequest request) {
        WatchlistGroup group = watchlistUseCase.removeItems(
                new ItemsCommand(userId(principal), groupCode, request.symbols()));
        return ResponseEntity.ok(toDetail(group));
    }

    // ─── 헬퍼 ────────────────────────────────────────────────────────────────

    private UUID userId(JwtUserDetails principal) {
        return UUID.fromString(principal.getUserId());
    }

    private List<GroupResponse> toGroupResponses(List<WatchlistGroup> groups) {
        return groups.stream().map(GroupResponse::from).toList();
    }

    /** 도메인 그룹 + 종목코드를 종목명과 결합해 상세 응답으로 변환. */
    private GroupDetailResponse toDetail(WatchlistGroup group) {
        Map<String, String> names = getStockMasterUseCase.getBySymbols(group.symbols()).stream()
                .collect(Collectors.toMap(StockMaster::symbol, StockMaster::name, (a, b) -> a));
        List<WatchlistItemResponse> items = group.symbols().stream()
                .map(symbol -> new WatchlistItemResponse(names.getOrDefault(symbol, symbol), symbol))
                .toList();
        return GroupDetailResponse.of(group, items);
    }
}
