import * as fs from 'fs';
import * as path from 'path';
import StrUtils from './StrUtils';
import FileReader from './FileReader';
import { attemptToGetContext, getAnnotation, getMetaData, isCommentLine, isEndOfMultiLine } from './logic';
import { AnnotationsManager, IMetaData, metaDataType } from './annotations';

const strUtils = new StrUtils();

const skipMetaDataIssue: IMetaData = { key: 'issue:', settings: { type: metaDataType.oneLine } };
const skipMetaDataNotes: IMetaData = { key: 'notes:', settings: { type: metaDataType.multiLine, maxLines: 3 } };
const skipMetaDataTodo: IMetaData = { key: 'todo:', settings: { type: metaDataType.multiLine, maxLines: 2 } };

export type contextType =
  | 'it'
  | 'describe'
  | 'skipped_it'
  | 'skipped_describe'
  | 'commented_function_call'
  | 'function_call'
  | 'no_context';
interface IContext {
  name?: string;
  lineIndex?: number;
  type?: contextType;
}

const manager = new AnnotationsManager({
  annotations: [
    {
      key: '-skip',
      printMessage: 'Total skipped Tests:',
      settings: { acceptStatus: true, caseSensitive: false },
      metaData: [skipMetaDataIssue, skipMetaDataNotes, skipMetaDataTodo],
    },
    {
      key: "-plaster",
      settings: { acceptStatus: false, caseSensitive: false },
      metaData: [skipMetaDataNotes], 
      printMessage: "Total Plasters: "
    }
  ],
  defaults: { maxLines: 3 },
});
const flagsMap = {};

const statusFlags = {
  full: false,
};

statusFlags.full = process.argv.includes('-f') || process.argv.includes('--full');
statusFlags.full = true;

const stack = ['./test/examples/a'];

const reports: any[] = [];

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
          let report: Partial<{
            key: string;
            status: string;
            metaData: object;
            line: number;
            context: IContext;
            file: string;
          }> = {};
          report.metaData = {};
          report.context = {};

          report.key = annotation.key;

          report.file = filePath;
          report.line = fileReader.currentLineIndex;

          if (annotation.settings.acceptStatus) {
            report.status = fileReader.getRestOfLine(fileReader.currentWordIndex + 1);
          }

          if (annotation.metaData?.length) {
            //find meta data
            let prevIndex = fileReader.currentLineIndex;
            let multiLineFlag = false;
            let currentMeta: IMetaData;
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

          console.log(report);

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

console.log('====== Results: ===== \n \n');

if (statusFlags.full) {
  console.log(flagsMap);
} else {
  for (const annotation of manager.annotations) {
    console.log(`${annotation.printMessage ? annotation.printMessage : annotation.key}: ${flagsMap[annotation.key]}`);
  }
}
