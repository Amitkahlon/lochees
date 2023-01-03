import * as fs from 'fs';
import * as path from 'path';
import FileReader from './FileReader';
import { attemptToGetContext, getAnnotation, getMetaData, isCommentLine, isEndOfMultiLine } from './logic';
import { ConfigManager } from './configManager';
import { IReport, IMetaDataConfig, metaDataType } from './model/interfaces';
import { cypressHandler } from './handler';
import { actualLog as logToConsole, overrideLog } from './logHelper';
import { EnvManger } from './env';
import { ReportManager } from './reportManager';
import StrUtils from './StrUtils';
const strUtils = new StrUtils();

export const envManager = new EnvManger(process.argv);

(async () => {
  const manager = new ConfigManager(cypressHandler);

  const reportManager = new ReportManager(envManager.flags.full);

  const stack = ['./test/examples/b'];

  const reports: Partial<IReport>[] = [];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    console.log(`Reading folder: ${currentDir}.......`);

    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const fileStat = fs.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        stack.push(filePath);
      } else {
        console.log(`\tFile: ${filePath}`);
        const fileReader = new FileReader(filePath);

        while (!fileReader.isEndOfFile()) {
          if (!isCommentLine(fileReader.currentLineRaw)) {
            fileReader.nextLine();
            continue;
          }

          const annotation = getAnnotation(fileReader, manager);

          if (!annotation) {
            fileReader.nextLine();
            continue;
          }

          if (envManager.flags.full) {
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

            //set warning
            if (annotation.warning) {
              const warningDependencies = { status: report.status, metaData: report.metaData };
              if (annotation.warning.warning) {
                report.warning = annotation.warning.warning(warningDependencies);
              } else if (annotation.warning.warningAsync) {
                report.warning = await annotation.warning.warningAsync(warningDependencies);
              }
            }

            reports.push(report);
          } else {
            const { simpleReport } = reportManager;
            if (simpleReport[annotation.key] == null) {
              simpleReport[annotation.key] = 1;
            } else {
              simpleReport[annotation.key]++;
            }
          }

          fileReader.nextLine();
        }
      }
    }
  }

  if (envManager.flags.output !== 'console') {
    overrideLog();
  }

  console.log('===================== Report ===================== \n');
  console.log(`Date: ${new Date(Date.now()).toString()}\n`);
  if (envManager.flags.full) {
    reports.forEach((r, i) => {
      console.log(`Flag number: ${i}`);
      const annotation = manager.getAnnotation(r.key);
      const printedMessage = annotation.printMessage(r);
      console.log(printedMessage);

      if (r.warning && r.warning.hasWarning) {
        r.warning.warnings.forEach((currentWarning) => {
          let separator = '*';
          let warningTitle = '';

          const lengths = strUtils.splitToLines(currentWarning.message).map((a) => a.length);
          const longestLength = Math.max(...lengths);

          for (let i = 0; i < longestLength; i++) {
            separator += '*';
          }

          for (let i = 0; i < (longestLength - "~~~ Warning ~~~".length) / 2; i++) {
            warningTitle += ' ';
          }


          warningTitle += "~~~ Warning ~~~";
          console.log(separator);

          console.log(warningTitle)


          console.log(separator);
          console.log(currentWarning.message);
          console.log(separator);
        });
      }

      console.log('\n');
    });
  } else {
    for (const annotation of manager.annotations) {
      console.log(`${annotation.printMessage ? annotation.printMessage : annotation.key}: ${reportManager.simpleReport[annotation.key]}`);
    }
  }

  console.log('===================== END REPORT ===================== ');

  if (envManager.flags.output !== 'console') {
    logToConsole(`Report Finished!\n check your report at ${envManager.flags.output}`)
  }
})();
