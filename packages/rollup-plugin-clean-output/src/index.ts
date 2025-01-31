import { join } from 'path';
import type { Plugin } from 'rollup';
import { createFilter, type FilterPattern } from '@rollup/pluginutils';
import { unlink } from 'fs/promises';
import { listDir } from './list-dir';

function cleanOutput(opt?: { exclude?: FilterPattern }): Plugin {
  const files = {
    atStart: new Set<string>(),
    atEnd: new Set<string>(),
  };

  const shouldExclude = opt?.exclude ? createFilter(opt.exclude) : undefined;

  return {
    name: 'clean-output',

    async renderStart(outputOptions) {
      // console.log('at render start, output options:', outputOptions);
      if (outputOptions.dir == null) return;
      if (files.atEnd.size) {
        console.log('not first round');
        // not first round, probably a watch round
        const tmp = files.atStart;
        files.atStart = files.atEnd;
        files.atEnd = tmp;
      } else {
        // first round, walk output dir, list all files and remember
        const filePaths = await listDir(outputOptions.dir);
        filePaths.forEach((f) => files.atStart.add(f));
      }
      console.log('=== files at start and end ===');
      console.dir(files);
    },

    async writeBundle(outputOptions, bundle) {
      if (outputOptions.dir == null) return;
      files.atEnd.clear();
      for (const fileName in bundle) {
        const f = join(outputOptions.dir, fileName);
        files.atStart.delete(f);
        files.atEnd.add(f);
      }
      const leftOvers = [] as Promise<void>[];
      for (const f of files.atStart) {
        if (shouldExclude?.(f)) continue;

        leftOvers.push(unlink(f));
      }
      await Promise.all(leftOvers);
    },
  };
}

export { cleanOutput };
export default cleanOutput;
