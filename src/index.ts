import * as fs from 'fs';
import * as path from 'path';
import FileReader from './FileReader';
import { attemptToGetContext, getAnnotation, getMetaData, isCommentLine, isEndOfMultiLine } from './logic';
import { ConfigManager } from './configManager';
import { IReport, IMetaDataConfig, metaDataType } from './model/interfaces';
import { cypressHandler } from './handler';
import { EnvManger } from './env';
import { ReportManager } from './reportManager';
import { generateReport } from './generateReport';

export const lochees = async (args: string[]) => {
  const envManager = EnvManger.Instance;
  envManager.build(args);
  const config = ConfigManager.Instance;
  config.build(cypressHandler);

  const reportManager = new ReportManager(envManager.flags.full);
  const stack = [envManager.flags.scanDirectory];

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

          const annotation = getAnnotation(fileReader, config);

          if (!annotation) {
            fileReader.nextLine();
            continue;
          }

          if (envManager.flags.full) {
            let report: IReport = {};
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
                    if (!report.metaData[currentMeta.key]) {
                      report.metaData[currentMeta.key] = '';
                    }

                    report.metaData[currentMeta.key] += '\n' + fileReader.getRestOfLine(fileReader.currentWordIndex + 1);
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
                  const isEnd = isEndOfMultiLine(fileReader, annotation, config, multiLineCount, currentMeta.settings.maxLines);

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

            reportManager.fullReport.push(report);
          } else {
            //TODO: Handle short report.
            console.log('Short report is currently unavailable');
            return;
          }

          fileReader.nextLine();
        }
      }
    }
  }

  generateReport(reportManager.fullReport);
};
