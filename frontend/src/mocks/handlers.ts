import { authHandlers } from './handlers/auth-handlers'
import { stockMasterHandlers } from './handlers/stock-master-handlers'
import { quoteHandlers } from './handlers/quote-handlers'
import { chartHandlers } from './handlers/chart-handlers'
import { marketHandlers } from './handlers/market-handlers'

export const handlers = [...authHandlers, ...stockMasterHandlers, ...quoteHandlers, ...chartHandlers, ...marketHandlers]
