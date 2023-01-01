import * as fs from 'fs';
import * as util from 'util';

export const overrideLog = (filePath: string = './debug.log') => {
  var log_file = fs.createWriteStream(__dirname + filePath, { flags: 'w' });
  var log_stdout = process.stdout;

  console.log = function (d) {
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
  };
};
