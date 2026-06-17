import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: { autodocs: 'tag' },
  viteFinal: async (viteConfig) => {
    // process.env 정의 (Vite는 기본 미정의)
    viteConfig.define = {
      ...viteConfig.define,
      'process.env': '{}',
      'process.env.NODE_ENV': JSON.stringify('development'),
    }

    // Next.js 모듈 mock
    viteConfig.resolve = viteConfig.resolve ?? {}
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias as Record<string, string>),
      '@': path.resolve(__dirname, '../src'),
      'next/link': path.resolve(__dirname, './__mocks__/next-link.tsx'),
      'next/navigation': path.resolve(__dirname, './__mocks__/next-navigation.ts'),
    }
    return viteConfig
  },
}

export default config
