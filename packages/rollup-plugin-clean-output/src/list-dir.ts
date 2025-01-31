import { readdir } from 'fs/promises';
import { join } from 'path';

export async function listDir(dir: string) {
  console.log('listDir', dir);

  const r = [] as string[];
  try {
    const dirents = await readdir(dir, { withFileTypes: true, recursive: true });
    for (const dirent of dirents) {
      if (dirent.isDirectory()) {
        const p = dirent.parentPath ?? dirent.path;
        r.push(join(p, dirent.name));
      }
    }
  } finally {
    return r;
  }
}
