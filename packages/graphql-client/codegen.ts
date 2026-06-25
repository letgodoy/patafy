import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'http://localhost:3000/graphql',
  documents: ['src/documents/**/*.graphql'],
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-query'],
      config: {
        scalars: { ID: 'string' },
        enumsAsTypes: true,
        skipTypename: true,
        fetcher: '../fetcher#fetcher',
        exposeQueryKeys: true,
        addInfiniteQuery: false,
        reactQueryVersion: 5,
      },
    },
  },
  ignoreNoDocuments: false,
}

export default config
