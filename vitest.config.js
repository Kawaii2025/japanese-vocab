import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.js'],
    reporters: ['default', 'html'],
    outputFile: {
      html: 'html/test-report.html'
    }
  }
});
