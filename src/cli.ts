#!/usr/bin/env node

import { lochees } from '.';
import * as fs from 'fs';
import * as path from 'path';

//attempt to get config file
fs.readFile(process.cwd() + '/.lochees', 'utf8', function (err, data) {
  if (!err) {
    try {
      const f = JSON.parse(data);
      if (f && (f['github-auth'] || f['gha'] || f['github_auth'])) {
        process.argv.push('--github-auth');
        const auth = f['github-auth'] || f['gha'] || f['github_auth'];
        process.argv.push(auth);
      }
    } catch (error) {}
  }

  console.log(process.argv);
  lochees();
});
