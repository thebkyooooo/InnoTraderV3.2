'use client'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { useServerInsertedHTML } from 'next/navigation'
import { useState } from 'react'

export function EmotionCacheProvider({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const c = createCache({ key: 'mui' })
    c.compat = true
    const prevInsert = c.insert.bind(c)
    let inserted: string[] = []
    c.insert = (...args: Parameters<typeof c.insert>) => {
      const serialized = args[1]
      if (c.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name)
      }
      return prevInsert(...args)
    }
    const flush = () => {
      const p = inserted
      inserted = []
      return p
    }
    return { cache: c, flush }
  })

  useServerInsertedHTML(() => {
    const names = flush()
    if (!names.length) return null
    let css = ''
    for (const name of names) {
      if (cache.inserted[name]) css += cache.inserted[name]
    }
    return (
      <style
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: css }}
      />
    )
  })

  return <CacheProvider value={cache}>{children}</CacheProvider>
}
