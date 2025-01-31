// import { builtinModules } from 'module';
// import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { resolve } from 'path';

/** @type {import('rollup').RollupOptions} */
const options = {
  input: './src/index.ts',
  output: [
    {
      dir: './dist',
      entryFileNames: 'cjs/[name].js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      dir: './dist',
      entryFileNames: 'es/[name].js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  // external: [...builtinModules],
  plugins: [
    // resolve(),
    typescript({
      declaration: true,
      declarationDir: './dist/types',
    }),
    {
      buildStart() {
        console.log('=== add watch for ', resolve('.env'));
        this.addWatchFile(resolve('.env'));
      },
    },
  ],
};

export default options;
