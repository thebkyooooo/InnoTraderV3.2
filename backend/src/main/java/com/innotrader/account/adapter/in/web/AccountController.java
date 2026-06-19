package com.innotrader.account.adapter.in.web;

import com.innotrader.account.adapter.in.web.dto.AccountResponse;
import com.innotrader.account.adapter.in.web.dto.OrderableAmountResponse;
import com.innotrader.account.adapter.in.web.dto.OrderableSharesResponse;
import com.innotrader.account.domain.port.in.AccountUseCase;
import com.innotrader.common.security.JwtUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST inbound adapter for 계좌내역 — 인증 필요 ({@code /api/private/accounts}).
 *
 * <p>사용자ID는 JWT 액세스 토큰({@link JwtUserDetails})에서 추출한다.
 *
 * <ul>
 *   <li>{@code GET /accountlist}           — 계좌목록 조회</li>
 *   <li>{@code GET /amount?accountNo=}      — 주문가능금액 조회</li>
 *   <li>{@code GET /shares?accountNo=&symbol=} — 주문가능수량 조회</li>
 *   <li>{@code POST /seed}                  — 기본 계좌 시드</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/private/accounts")
public class AccountController {

    private final AccountUseCase accountUseCase;

    public AccountController(AccountUseCase accountUseCase) {
        this.accountUseCase = accountUseCase;
    }

    /** 계좌목록 조회 */
    @GetMapping("/accountlist")
    public ResponseEntity<List<AccountResponse>> accountList(@AuthenticationPrincipal JwtUserDetails principal) {
        List<AccountResponse> result = accountUseCase.listAccounts(userId(principal)).stream()
                .map(AccountResponse::from)
                .toList();
        return ResponseEntity.ok(result);
    }

    /** 주문가능금액 조회 */
    @GetMapping("/amount")
    public ResponseEntity<OrderableAmountResponse> amount(@AuthenticationPrincipal JwtUserDetails principal,
                                                          @RequestParam String accountNo) {
        long amount = accountUseCase.orderableAmount(userId(principal), accountNo);
        return ResponseEntity.ok(new OrderableAmountResponse(accountNo, amount));
    }

    /** 주문가능수량 조회 */
    @GetMapping("/shares")
    public ResponseEntity<OrderableSharesResponse> shares(@AuthenticationPrincipal JwtUserDetails principal,
                                                          @RequestParam String accountNo,
                                                          @RequestParam String symbol) {
        return ResponseEntity.ok(OrderableSharesResponse.from(
                accountUseCase.orderableShares(userId(principal), accountNo, symbol)));
    }

    /** 기본 계좌 시드 (계좌번호 기준 멱등) */
    @PostMapping("/seed")
    public ResponseEntity<List<AccountResponse>> seed(@AuthenticationPrincipal JwtUserDetails principal) {
        UUID uid = userId(principal);
        accountUseCase.seedDefaults(uid);
        return ResponseEntity.ok(accountUseCase.listAccounts(uid).stream().map(AccountResponse::from).toList());
    }

    private UUID userId(JwtUserDetails principal) {
        return UUID.fromString(principal.getUserId());
    }
}
