-- change_rate 컬럼을 NUMERIC(7,2) → DOUBLE PRECISION 으로 변경
-- (JPA 엔티티의 double 필드가 PostgreSQL float(53)을 기대하기 때문)
ALTER TABLE market_daily_trends
    ALTER COLUMN change_rate TYPE DOUBLE PRECISION
        USING change_rate::DOUBLE PRECISION;
