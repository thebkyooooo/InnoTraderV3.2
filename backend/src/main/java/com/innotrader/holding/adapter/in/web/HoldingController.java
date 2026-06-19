package com.innotrader.holding.adapter.in.web;

import com.innotrader.common.security.JwtUserDetails;
import com.innotrader.holding.adapter.in.web.dto.HoldingsResponse;
import com.innotrader.holding.domain.port.in.HoldingUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST inbound adapter for 계좌잔고(주식잔고) — 인증 필요 ({@code /api/private/holdings}).
 *
 * <ul>
 *   <li>{@code GET  /holdings?accountNo=} — 주식잔고 조회 (요약 + 보유종목 목록)</li>
 *   <li>{@code POST /seed}               — 계좌별 보유종목 시드</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/private/holdings")
public class HoldingController {

    private final HoldingUseCase holdingUseCase;

    public HoldingController(HoldingUseCase holdingUseCase) {
        this.holdingUseCase = holdingUseCase;
    }

    /** 주식잔고 조회 */
    @GetMapping("/holdings")
    public ResponseEntity<HoldingsResponse> holdings(@AuthenticationPrincipal JwtUserDetails principal,
                                                     @RequestParam String accountNo) {
        return ResponseEntity.ok(HoldingsResponse.from(
                holdingUseCase.getHoldings(userId(principal), accountNo)));
    }

    /** 계좌별 보유종목 시드 (계좌 단위 멱등) */
    @PostMapping("/seed")
    public ResponseEntity<Void> seed(@AuthenticationPrincipal JwtUserDetails principal) {
        holdingUseCase.seedDefaults(userId(principal));
        return ResponseEntity.ok().build();
    }

    private UUID userId(JwtUserDetails principal) {
        return UUID.fromString(principal.getUserId());
    }
}
