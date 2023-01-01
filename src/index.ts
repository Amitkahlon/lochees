import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import StrUtils from './StrUtils';
import FileReader from './FileReader';
import { attemptToGetContext, getAnnotation, getMetaData, isCommentLine, isEndOfMultiLine } from './logic';
import { ConfigManager } from './configManager';
import { DEFAULT_META_DATA } from './model/defaultSettings';
import { IReport, IMetaDataConfig, metaDataType } from './model/interfaces';

const strUtils = new StrUtils();

const manager = new ConfigManager((b) => {
  b.addAnnotation({
    key: '-skip',
    printMessage: ({ metaData, status, file, context, key, line }) => {
      let sb = `File: ${file} line: ${line}\n` + `Key: SKIP\n` + `Status: ${status}\n`;

      const { lineIndex, name, type } = context;
      if (type !== 'no_context') {
        sb += 'Context:\n' + `\tName: ${name}\n` + `\tType: "${type}"\n` + `\tline: ${lineIndex}\n`;
      } else {
        sb += `Context: No context found, make sure you placed your flag correctly\n`;
      }

      if (metaData) {
        sb += `Meta Data:\n`;
        for (const metaDataKey in metaData) {
          const metaDataDetails = metaData[metaDataKey] as string;
          sb += `\t${metaDataKey}:\n`;
          sb +=
            '\t\t' +
            strUtils
              .splitToLines(metaDataDetails)
              .map((m) => m.trim())
              .join('\n\t\t');
          sb += '\n';
        }
      }

      return sb;
    },
    settings: { acceptStatus: true, caseSensitive: false },
  }).addMetaData(DEFAULT_META_DATA.issue);

  b.addAnnotation({
    key: '-plaster',
    settings: { acceptStatus: false, caseSensitive: false },
    printMessage: ({ context, file, key, line, metaData, status }) => {
      let sb = `File: ${file} line: ${line}\n` + `Key: Plaster\n`;

      const { lineIndex, name, type } = context;
      if (type !== 'no_context') {
        sb += 'Context:\n' + `\tName: ${name}\n` + `\tType: "${type}"\n` + `\tline: ${lineIndex}\n`;
      } else {
        sb += `Context: No context found, make sure you placed your flag correctly\n`;
      }

      if (metaData) {
        sb += `Meta Data:\n`;
        for (const metaDataKey in metaData) {
          const metaDataDetails = metaData[metaDataKey] as string;
          sb += `\t${metaDataKey}:\n`;
          sb +=
            '\t\t' +
            strUtils
              .splitToLines(metaDataDetails)
              .map((m) => m.trim())
              .join('\n\t\t');
          sb += '\n';
        }
      }

      return sb;
    },
  });

  b.addGlobalMetaData(DEFAULT_META_DATA.notes).addGlobalMetaData(DEFAULT_META_DATA.todo);
});

const flagsMap = {};

const statusFlags = {
  full: false,
};

statusFlags.full = process.argv.includes('-f') || process.argv.includes('--full');
statusFlags.full = true;

const stack = ['./test/examples/a'];

const reports: Partial<IReport>[] = [];

while (stack.length > 0) {
  const currentDir = stack.pop();
  console.log(`Reading folder: ${currentDir}`);

  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    const fileStat = fs.lstatSync(filePath);

    if (fileStat.isDirectory()) {
      stack.push(filePath);
    } else {
      console.log(`File: ${filePath}`);
      const fileReader = new FileReader(filePath);

      while (!fileReader.isEndOfFile()) {
        console.log(fileReader.currentLineRaw);
        if (!isCommentLine(fileReader.currentLineRaw)) {
          fileReader.nextLine();
          continue;
        }

        const annotation = getAnnotation(fileReader, manager);

        if (!annotation) {
          fileReader.nextLine();
          continue;
        }

        if (statusFlags.full) {
          let report: Partial<IReport> = {};
          report.metaData = {};
          report.context = {};

          report.key = annotation.key;

          report.file = filePath;
          report.line = fileReader.currentLineIndex;

          if (annotation.settings.acceptStatus) {
            report.status = fileReader.getRestOfLine(fileReader.currentWordIndex + 1);
          }

          if (annotation.metaData?.length) {
            let prevIndex = fileReader.currentLineIndex;
            let multiLineFlag = false;
            let currentMeta: IMetaDataConfig;
            let multiLineCount: number;
            fileReader.nextLine();

            //stops when couldn't find a meta data or reached end of line
            while (!fileReader.isEndOfFile()) {
              if (!multiLineFlag) {
                currentMeta = getMetaData(fileReader, annotation);

                if (currentMeta) {
                  report.metaData[currentMeta.key] = fileReader.getRestOfLine(fileReader.currentWordIndex + 1);
                } else {
                  fileReader.prevLine();
                  break;
                }

                if (currentMeta.settings.type === metaDataType.multiLine) {
                  multiLineFlag = true;
                  multiLineCount = 1;
                }

                fileReader.nextLine();
              } else {
                const isEnd = isEndOfMultiLine(fileReader, annotation, manager, multiLineCount, currentMeta.settings.maxLines);

                if (isEnd) {
                  multiLineFlag = false;
                  currentMeta = null;
                  continue;
                }

                report.metaData[currentMeta.key] += '\n' + fileReader.getRestOfLine(0);

                multiLineCount++;
                fileReader.nextLine();
              }
            }
          }

          //set context
          const { name, type, foundIndex } = attemptToGetContext(fileReader.lines.slice(fileReader.currentLineIndex));
          report.context.name = name;
          report.context.type = type;
          report.context.lineIndex = foundIndex + fileReader.currentLineIndex;

          reports.push(report);
        } else {
          if (flagsMap[annotation.key] == null) {
            flagsMap[annotation.key] = 1;
          } else {
            flagsMap[annotation.key]++;
          }
        }

        fileReader.nextLine();
      }
    }
  }
}

var log_file = fs.createWriteStream(__dirname + '/debug.log', { flags: 'w' });
var log_stdout = process.stdout;

console.log = function (d) {
  //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

console.log('===================== Report ===================== \n');
console.log(`Date: ${new Date(Date.now()).toString()}\n`);
if (statusFlags.full) {
  reports.forEach((r, i) => {
    console.log(`Flag number: ${i}`);
    const annotation = manager.getAnnotation(r.key);
    const printedMessage = annotation.printMessage(r);
    console.log(printedMessage);

    console.log('\n');
  });
} else {
  for (const annotation of manager.annotations) {
    console.log(`${annotation.printMessage ? annotation.printMessage : annotation.key}: ${flagsMap[annotation.key]}`);
  }
}

console.log('===================== END REPORT ===================== ');
