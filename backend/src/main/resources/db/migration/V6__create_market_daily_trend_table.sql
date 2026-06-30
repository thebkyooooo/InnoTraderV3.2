-- 시장 일별 투자동향 테이블
CREATE TABLE market_daily_trends (
    id              BIGSERIAL      PRIMARY KEY,
    market          VARCHAR(10)    NOT NULL,
    trade_date      DATE           NOT NULL,
    closing_price   BIGINT         NOT NULL,
    prev_diff       BIGINT         NOT NULL,
    change_rate     NUMERIC(7, 2)  NOT NULL,
    volume          BIGINT         NOT NULL,
    foreign_net     BIGINT         NOT NULL,
    individual_net  BIGINT         NOT NULL,
    institution_net BIGINT         NOT NULL,
    CONSTRAINT uq_market_daily_trend UNIQUE (market, trade_date)
);

CREATE INDEX idx_market_daily_trends_market_date
    ON market_daily_trends (market, trade_date DESC);

-- ── 시드 데이터 (KOSPI/KOSDAQ/ALL, 2024-01-02 ~ 2026-06-27 영업일) ────────────
INSERT INTO market_daily_trends
    (market, trade_date, closing_price, prev_diff, change_rate, volume, foreign_net, individual_net, institution_net)
WITH d AS (
    SELECT
        s::DATE                                  AS trade_date,
        ROW_NUMBER() OVER (ORDER BY s)::BIGINT   AS n
    FROM generate_series('2024-01-02'::DATE, '2026-06-27'::DATE, '1 day') s
    WHERE EXTRACT(DOW FROM s) NOT IN (0, 6)          -- 영업일만
)
SELECT
    'KOSPI',
    trade_date,
    2600 + (n % 23 - 11) * 18 + n * 3 / 10                                   AS closing_price,
    (n % 7 - 3) * 14                                                           AS prev_diff,
    ROUND(((n % 7 - 3) * 14)::NUMERIC
          / GREATEST(2600 + (n % 23 - 11) * 18 + n * 3 / 10, 1) * 100, 2)   AS change_rate,
    380000000 + (n % 11) * 15000000                                            AS volume,
    (n % 13 - 6) * 250                                                         AS foreign_net,
    (n % 9  - 4) * 350                                                         AS individual_net,
    -(((n % 13 - 6) * 250) + ((n % 9 - 4) * 350))                            AS institution_net
FROM d
UNION ALL
SELECT
    'KOSDAQ',
    trade_date,
    750 + (n % 19 - 9) * 8 + n / 5                                            AS closing_price,
    (n % 7 - 3) * 5                                                            AS prev_diff,
    ROUND(((n % 7 - 3) * 5)::NUMERIC
          / GREATEST(750 + (n % 19 - 9) * 8 + n / 5, 1) * 100, 2)           AS change_rate,
    1200000000 + (n % 13) * 80000000                                           AS volume,
    (n % 11 - 5) * 180                                                         AS foreign_net,
    (n % 7  - 3) * 250                                                         AS individual_net,
    -(((n % 11 - 5) * 180) + ((n % 7 - 3) * 250))                            AS institution_net
FROM d
UNION ALL
SELECT
    'ALL',
    trade_date,
    3350 + (n % 23 - 11) * 26 + n * 4 / 10                                   AS closing_price,
    (n % 7 - 3) * 19                                                           AS prev_diff,
    ROUND(((n % 7 - 3) * 19)::NUMERIC
          / GREATEST(3350 + (n % 23 - 11) * 26 + n * 4 / 10, 1) * 100, 2)  AS change_rate,
    1580000000 + (n % 11) * 95000000                                           AS volume,
    (n % 13 - 6) * 430                                                         AS foreign_net,
    (n % 9  - 4) * 600                                                         AS individual_net,
    -(((n % 13 - 6) * 430) + ((n % 9 - 4) * 600))                            AS institution_net
FROM d;
