import { defineConfig } from 'orval'

export default defineConfig({
  innotrader: {
    input: {
      target: '../backend/build/api-spec/openapi3.yaml',
    },
    output: {
      mode: 'tags-split',
      target: 'src/shared/api/generated/endpoints',
      schemas: 'src/shared/api/generated/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/shared/api/axios-instance.ts',
          name: 'customAxios',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
})
