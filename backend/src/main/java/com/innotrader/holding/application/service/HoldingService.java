package com.innotrader.holding.application.service;

import com.innotrader.account.domain.port.in.AccountUseCase;
import com.innotrader.common.annotation.UseCase;
import com.innotrader.common.error.BusinessException;
import com.innotrader.holding.domain.model.Holding;
import com.innotrader.holding.domain.port.in.HoldingUseCase;
import com.innotrader.holding.domain.port.out.HoldingPort;
import com.innotrader.stock.domain.model.StockMaster;
import com.innotrader.stock.domain.port.in.GetStockMasterUseCase;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

/**
 * 계좌잔고(주식잔고) 애플리케이션 서비스.
 *
 * <ul>
 *   <li>보유종목별 평가금액/수익금/수익률을 현재가(stock master)로 계산</li>
 *   <li>요약: 총평가금액/원금/총수익금/총수익률, 총자산 = 총평가금액 + 예수금(주문가능금액)</li>
 *   <li>계좌별 보유종목 시드 (123-456789-01: 50, -02: 30, -71: 없음), 계좌 단위 멱등</li>
 * </ul>
 */
@UseCase
@Transactional
public class HoldingService implements HoldingUseCase {

    private record Seed(String accountNo, int count) {}

    private static final List<Seed> SEEDS = List.of(
            new Seed("123-456789-01", 50),
            new Seed("123-456789-02", 30),
            new Seed("123-456789-71", 0)
    );

    private final HoldingPort holdingPort;
    private final GetStockMasterUseCase getStockMasterUseCase;
    private final AccountUseCase accountUseCase;

    public HoldingService(HoldingPort holdingPort,
                          GetStockMasterUseCase getStockMasterUseCase,
                          AccountUseCase accountUseCase) {
        this.holdingPort = holdingPort;
        this.getStockMasterUseCase = getStockMasterUseCase;
        this.accountUseCase = accountUseCase;
    }

    @Override
    @Transactional(readOnly = true)
    public HoldingsResult getHoldings(UUID userId, String accountNo) {
        List<Holding> holdings = holdingPort.findByAccount(userId, accountNo);

        List<HoldingItem> items = new ArrayList<>(holdings.size());
        long totalEval = 0, principal = 0;
        for (Holding h : holdings) {
            StockMaster stock = getStockMasterUseCase.getBySymbol(h.symbol()).orElse(null);
            long price  = stock != null ? stock.price() : h.avgPrice();
            String name = stock != null ? stock.name() : h.symbol();
            long eval   = h.quantity() * price;
            long cost   = h.quantity() * h.avgPrice();
            long profit = eval - cost;
            double rate = cost == 0 ? 0 : Math.round(profit * 10000.0 / cost) / 100.0;
            items.add(new HoldingItem(name, h.symbol(), h.quantity(), h.avgPrice(), price, eval, profit, rate));
            totalEval += eval;
            principal += cost;
        }

        long totalProfit = totalEval - principal;
        double totalRate = principal == 0 ? 0 : Math.round(totalProfit * 10000.0 / principal) / 100.0;
        long totalAssets = totalEval + cashOf(userId, accountNo);

        return new HoldingsResult(
                new HoldingSummary(totalAssets, totalEval, principal, totalProfit, totalRate),
                items);
    }

    @Override
    public void seedDefaults(UUID userId) {
        List<StockMaster> universe = getStockMasterUseCase.getByMarket("ALL");
        for (Seed seed : SEEDS) {
            if (seed.count() == 0) continue;
            if (!holdingPort.findByAccount(userId, seed.accountNo()).isEmpty()) continue;

            Random rng = new Random(seed.accountNo().hashCode());
            List<StockMaster> copy = new ArrayList<>(universe);
            Collections.shuffle(copy, rng);
            copy.stream().limit(seed.count()).forEach(s -> {
                long qty = 1 + rng.nextInt(100);
                long avg = Math.max(1L, Math.round(s.price() * (0.8 + rng.nextDouble() * 0.4)));
                holdingPort.save(Holding.create(userId, seed.accountNo(), s.symbol(), qty, avg));
            });
        }
    }

    /** 예수금(주문가능금액). 계좌가 없으면 0. */
    private long cashOf(UUID userId, String accountNo) {
        try {
            return accountUseCase.orderableAmount(userId, accountNo);
        } catch (BusinessException e) {
            return 0L;
        }
    }

    @Override
    public void applyFill(UUID userId, String accountNo, String symbol, boolean isBuy, long fillQuantity, long fillPrice) {
        Optional<Holding> existing = holdingPort.findByAccountAndSymbol(userId, accountNo, symbol);
        if (isBuy) {
            if (existing.isPresent()) {
                Holding h = existing.get();
                long newQuantity = h.quantity() + fillQuantity;
                long newAvgPrice = Math.round(
                        (h.quantity() * (double) h.avgPrice() + fillQuantity * (double) fillPrice) / newQuantity);
                holdingPort.save(new Holding(h.id(), userId, accountNo, symbol, newQuantity, newAvgPrice));
            } else {
                holdingPort.save(Holding.create(userId, accountNo, symbol, fillQuantity, fillPrice));
            }
        } else {
            // 매도 체결 — 보유가 없으면(이론상 발생하지 않음) 무시
            existing.ifPresent(h -> {
                long newQuantity = h.quantity() - fillQuantity;
                if (newQuantity <= 0) {
                    holdingPort.delete(h);
                } else {
                    holdingPort.save(new Holding(h.id(), userId, accountNo, symbol, newQuantity, h.avgPrice()));
                }
            });
        }
    }
}
