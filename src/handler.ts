import { configBuilder } from './configManager';
import { DEFAULT_META_DATA } from './model/defaultSettings';
import { Octokit } from '@octokit/core';
import { IWarning, IWarningDetails } from './model/interfaces';
import StrUtils from './StrUtils';
const strUtils = new StrUtils();

export const handler = (b: configBuilder) => {
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
  })
    .addMetaData(DEFAULT_META_DATA.issue)
    .addWarning({
      warningAsync: async ({ metaData, status }) => {
        const w: IWarning[] = [];
        if (status === 'bug - no open issue') {
          w.push({
            warningLevel: 1,
            message: 'Warning! You did not open issue for this skip! make sure you do so',
          });
        }

        const issue = metaData['issue:'];
        if (issue) {
          const octokit = new Octokit();

          const res = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
            owner: 'cypress-io',
            repo: 'cypress',
            issue_number: 25284,
          });

          if (res.data.state === 'closed') {
            w.push({
              warningLevel: 1,
              message: `Warning! The Issue that is assigned to this skip is closed! check if you can un-skip it!\nIssue: ${issue}`,
            });
          }
        }

        return { hasWarning: true, warnings: w };
      },
    });

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
};
