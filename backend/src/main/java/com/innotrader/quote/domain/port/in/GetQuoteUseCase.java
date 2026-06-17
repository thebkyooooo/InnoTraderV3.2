package com.innotrader.quote.domain.port.in;

import com.innotrader.quote.domain.model.CurrentPrice;
import com.innotrader.quote.domain.model.DailyQuote;
import com.innotrader.quote.domain.model.FilledQuote;
import com.innotrader.quote.domain.model.HogaData;
import com.innotrader.quote.domain.model.InvestmentTrend;
import com.innotrader.quote.domain.model.QuoteDetail;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;

public interface GetQuoteUseCase {

    record QuotePage<T>(List<T> items, String nextCursor, boolean hasNext) {
        public <R> QuotePage<R> map(Function<T, R> fn) {
            return new QuotePage<>(items.stream().map(fn).toList(), nextCursor, hasNext);
        }
    }

    Optional<CurrentPrice>     getCurrentPrice(String symbol);
    QuotePage<DailyQuote>      getDailyQuotes(String symbol, int size, String cursor);
    QuotePage<FilledQuote>     getFilledQuotes(String symbol, int size, String cursor);
    Optional<HogaData>         getHoga(String symbol);
    QuotePage<InvestmentTrend> getInvestmentTrends(String symbol, int size, String cursor);
    Optional<QuoteDetail>      getDetail(String symbol);
}
