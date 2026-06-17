import React from 'react'

interface LinkProps {
  href: string
  children: React.ReactNode
  [key: string]: unknown
}

const Link = ({ href, children, ...props }: LinkProps) => (
  <a href={href} {...props}>
    {children}
  </a>
)

export default Link
