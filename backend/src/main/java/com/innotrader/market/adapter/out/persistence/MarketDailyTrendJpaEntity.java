package com.innotrader.market.adapter.out.persistence;

import com.innotrader.market.domain.model.DailyTrend;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "market_daily_trends")
public class MarketDailyTrendJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String market;

    @Column(nullable = false)
    private LocalDate tradeDate;

    @Column(nullable = false)
    private long closingPrice;

    @Column(nullable = false)
    private long prevDiff;

    @Column(nullable = false)
    private double changeRate;

    @Column(nullable = false)
    private long volume;

    @Column(nullable = false)
    private long foreignNet;

    @Column(nullable = false)
    private long individualNet;

    @Column(nullable = false)
    private long institutionNet;

    protected MarketDailyTrendJpaEntity() {}

    public Long getId() { return id; }
    public String getMarket() { return market; }
    public LocalDate getTradeDate() { return tradeDate; }
    public long getClosingPrice() { return closingPrice; }
    public long getPrevDiff() { return prevDiff; }
    public double getChangeRate() { return changeRate; }
    public long getVolume() { return volume; }
    public long getForeignNet() { return foreignNet; }
    public long getIndividualNet() { return individualNet; }
    public long getInstitutionNet() { return institutionNet; }

    public DailyTrend toDomain() {
        return new DailyTrend(tradeDate, closingPrice, prevDiff, changeRate, volume, foreignNet, individualNet, institutionNet);
    }
}
