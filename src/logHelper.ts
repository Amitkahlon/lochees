import * as fs from 'fs';
import * as util from 'util';
import StrUtils from './StrUtils';

let original;

const strUtils = new StrUtils();

export const overrideLog = (filePath: string = '/debug.log') => {
  var log_file = fs.createWriteStream(process.cwd() + filePath, { flags: 'w' });
  var log_stdout = process.stdout;

  original = console.log;

  console.log = function (d) {
    log_file.write(util.format(d) + '\n');
    // log_stdout.write(util.format(d) + '\n');
  };
};

export const actualLog = (text: string) => {
  if (original) {
    original(text);
  } else {
    console.log(text);
  }
};

export const logWarning = (warningMessage: string) => {
  let separator = '*';
  let warningTitle = '';

  const lengths = strUtils.splitToLines(warningMessage).map((a) => a.length);
  const longestLength = Math.max(...lengths);

  for (let i = 0; i < longestLength; i++) {
    separator += '*';
  }

  for (let i = 0; i < (longestLength - '~~~ Warning ~~~'.length) / 2; i++) {
    warningTitle += ' ';
  }

  warningTitle += '~~~ Warning ~~~';
  console.log(separator);

  console.log(warningTitle);

  console.log(separator);
  console.log(warningMessage);
  console.log(separator);
};
