import { authHandlers } from './handlers/auth-handlers'
import { stockMasterHandlers } from './handlers/stock-master-handlers'
import { quoteHandlers } from './handlers/quote-handlers'
import { chartHandlers } from './handlers/chart-handlers'
import { marketHandlers } from './handlers/market-handlers'
import { watchlistHandlers } from './handlers/watchlist-handlers'
import { accountHandlers } from './handlers/account-handlers'
import { holdingHandlers } from './handlers/holding-handlers'
import { orderHandlers } from './handlers/order-handlers'

export const handlers = [...authHandlers, ...stockMasterHandlers, ...quoteHandlers, ...chartHandlers, ...marketHandlers, ...watchlistHandlers, ...accountHandlers, ...holdingHandlers, ...orderHandlers]
