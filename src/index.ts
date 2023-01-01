import * as fs from 'fs';
import * as path from 'path';
import FileReader from './FileReader';
import { attemptToGetContext, getAnnotation, getMetaData, isCommentLine, isEndOfMultiLine } from './logic';
import { ConfigManager } from './configManager';
import { IReport, IMetaDataConfig, metaDataType } from './model/interfaces';
import { handler } from './handler';
import { overrideLog } from './logHelper';

const manager = new ConfigManager(handler);

const reportManager: {
  flagsMap: object;
  fullReports: Partial<IReport>[];
} = {
  flagsMap: {},
  fullReports: [],
};

const runFlags: {
  full: boolean;
  output: 'console' | string;
} = {
  full: false,
  output: 'console',
};

runFlags.full = process.argv.includes('-f') || process.argv.includes('--full');
for (let i = 0; i < process.argv.length; i++) {
  const arg = process.argv[i];

  if (arg.includes('-o') || arg.includes('--output')) {
    const output = process.argv[i + 1];
    if (!output) {
      console.error('output was not provider, please provide a file path');
      throw new Error('output was not provider, please provide a file path');
    }
    runFlags.output = output;
    break;
  }
}

runFlags.full = true;
runFlags.output = 'console';

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

        if (runFlags.full) {
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
          if (reportManager.flagsMap[annotation.key] == null) {
            reportManager.flagsMap[annotation.key] = 1;
          } else {
            reportManager.flagsMap[annotation.key]++;
          }
        }

        fileReader.nextLine();
      }
    }
  }
}


if(runFlags.output !== "console") {
  overrideLog()
}

console.log('===================== Report ===================== \n');
console.log(`Date: ${new Date(Date.now()).toString()}\n`);
if (runFlags.full) {
  reports.forEach((r, i) => {
    console.log(`Flag number: ${i}`);
    const annotation = manager.getAnnotation(r.key);
    const printedMessage = annotation.printMessage(r);
    console.log(printedMessage);

    console.log('\n');
  });
} else {
  for (const annotation of manager.annotations) {
    console.log(`${annotation.printMessage ? annotation.printMessage : annotation.key}: ${reportManager.flagsMap[annotation.key]}`);
  }
}

console.log('===================== END REPORT ===================== ');
