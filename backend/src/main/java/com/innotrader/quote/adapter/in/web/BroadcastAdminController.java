package com.innotrader.quote.adapter.in.web;

import com.innotrader.quote.application.task.StockPriceBroadcaster;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 실시간 브로드캐스트 주기 관리 API (ROLE_ADMIN 전용).
 *
 * <ul>
 *   <li>GET  /api/admin/broadcast/interval — 현재 주기 조회</li>
 *   <li>POST /api/admin/broadcast/interval — 주기 변경 (런타임 즉시 적용)</li>
 * </ul>
 */
@Tag(name = "관리자", description = "브로드캐스트 설정 관리 API")
@RestController
@RequestMapping("/api/admin/broadcast")
@PreAuthorize("hasRole('ADMIN')")
public class BroadcastAdminController {

    private final StockPriceBroadcaster broadcaster;

    public BroadcastAdminController(StockPriceBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    @Operation(summary = "현재 브로드캐스트 주기 조회")
    @GetMapping("/interval")
    public ResponseEntity<Map<String, Long>> getInterval() {
        return ResponseEntity.ok(Map.of("ms", broadcaster.getCurrentIntervalMs()));
    }

    @Operation(summary = "브로드캐스트 주기 변경", description = "100~60000ms 범위. 즉시 적용.")
    @PostMapping("/interval")
    public ResponseEntity<Map<String, Long>> setInterval(@RequestBody Map<String, Long> body) {
        Long ms = body.get("ms");
        if (ms == null || ms < 100 || ms > 60_000) {
            return ResponseEntity.badRequest().build();
        }
        broadcaster.reschedule(ms);
        return ResponseEntity.ok(Map.of("ms", ms));
    }
}
