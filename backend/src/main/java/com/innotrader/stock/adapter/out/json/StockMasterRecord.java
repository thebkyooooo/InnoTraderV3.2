package com.innotrader.stock.adapter.out.json;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Jackson deserialization DTO for stock-master.json entries. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record StockMasterRecord(
        String market,
        int    rank,
        String name,
        String symbol,
        long   price,
        long   prevDiff,
        double change,
        long   volume,
        long   lstdShrs,
        long   marketCap
) {}
