import { runCLI } from 'jest';

const result = await runCLI({
  config: JSON.stringify({
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    }
  }),
  runInBand: true,
  noCache: true
}, [process.cwd()]);

if (!result.results.success) {
  process.exit(1);
}
