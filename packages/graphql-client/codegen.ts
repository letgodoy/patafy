import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'http://localhost:3000/graphql',
  documents: ['src/documents/**/*.graphql'],
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        scalars: {
          ID: 'string',
        },
        enumsAsTypes: true,
        avoidOptionals: false,
        skipTypename: true,
        nonOptionalTypename: false,
      },
    },
  },
  ignoreNoDocuments: false,
}

export default config
