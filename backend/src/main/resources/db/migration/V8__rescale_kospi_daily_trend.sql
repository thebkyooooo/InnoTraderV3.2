-- KOSPI closing_price를 /index 기준값(KS11 = 8713.42)에 맞춰 재스케일.
-- V6 시드의 기준가(2600)와 /index 기준가(8713)가 달라 발생한 불일치를 해소한다.
-- 새 공식: 8750 + (n%23-11)*30 + n*3/10  → n≈647(2026-06-27) 시 ≈ 8704 (오차 0.1%)
WITH ranks AS (
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY trade_date)::BIGINT AS n
    FROM market_daily_trends
    WHERE market = 'KOSPI'
)
UPDATE market_daily_trends t
SET closing_price = 8750 + (r.n % 23 - 11) * 30 + r.n * 3 / 10,
    prev_diff     = (r.n % 7 - 3) * 46,
    change_rate   = ROUND(
                      ((r.n % 7 - 3) * 46)::NUMERIC
                      / GREATEST(8750 + (r.n % 23 - 11) * 30 + r.n * 3 / 10, 1) * 100,
                    2)
FROM ranks r
WHERE t.id = r.id;
