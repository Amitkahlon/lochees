import { configBuilder } from './configManager';
import { DEFAULT_META_DATA } from './model/defaultSettings';
import { Octokit } from '@octokit/core';
import { IContext, IReport, IWarning, IWarningDetails } from './model/interfaces';
import StrUtils from './StrUtils';
import { getFromNow, removeGithubBase } from './logic';
import { envManager } from '.';
import { StringBuilder } from './stringBuilder';
const strUtils = new StrUtils();

export const cypressHandler = (b: configBuilder) => {
  skipAnnotationHandler(b);
  plasterAnnotationHandler(b);
  sensitiveAnnotationHandler(b);
  flakyAnnotationHandler(b);

  b.addGlobalMetaData(DEFAULT_META_DATA.notes).addGlobalMetaData(DEFAULT_META_DATA.todo);
};

export const githubIssueHandler = async (issue: string, warning: IWarning[]) => {
  if (issue) {
    const octokit = new Octokit({ auth: envManager.flags.github_access_token });

    const params = removeGithubBase(issue);

    try {
      const res = await octokit.request('GET /repos/' + params);

      const { title, updated_at, state_reason, state, created_at, closed_at } = res.data;

      if (state === 'closed') {
        warning.push({
          warningLevel: 1,
          message:
            `The Associated Issue to this skip is closed! check if you can un-skip it!\n` +
            `\tIssue: ${issue}\n` +
            `\tWas Closed: ${closed_at} ${getFromNow(closed_at)}\n` +
            `\tTitle: ${title}\n` +
            `\tCreated: ${created_at} ${getFromNow(created_at)}\n` +
            `\tState Reason: ${state_reason}\n` +
            `\tLast Updated at: ${updated_at} ${getFromNow(updated_at)}`,
        });
      }
    } catch (error) {
      let err = `Warning! The Associated Issue to this skip is unavailable\n` + `\tIssue: ${issue}\n`;

      if (envManager.flags.full_error) {
        err += `Error: \n${JSON.stringify(error, null, 4)}\n`;
      } else {
        err += `Error: \n${JSON.stringify(error.data, null, 4)}\n` + `To see full error use the --error-full flag\n`;
      }

      if (!envManager.flags.github_access_token) {
        err += `If your issues needs authentication make sure you add github access token 'github-auth {your token}'`;
      }

      warning.push({ warningLevel: 1, message: err });
    }
  }
};

export const skipAnnotationHandler = (b: configBuilder) => {
  b.addAnnotation({
    key: '-skip',
    printMessage: (report) => {
      const { metaData, status, file, context, key, line } = report;
      let sb = new StringBuilder();

      defaultHandlers(report, sb);
      return sb.toString();
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
            message: 'There is no issue open for this skip',
          });
        }

        const issue = metaData['issue:'];
        if (issue && issue.includes('github')) {
          await githubIssueHandler(issue, w);
        }

        return { hasWarning: !!w.length, warnings: w };
      },
    });
};

export const plasterAnnotationHandler = (b: configBuilder) => {
  b.addAnnotation({
    key: '-plaster',
    settings: { acceptStatus: false, caseSensitive: false },
    printMessage: (report) => {
      const { metaData, status, file, context, key, line } = report;

      let sb = new StringBuilder();
      fileHandler({ file, line, status, key }, sb);
      contextHandler(context, sb);
      metaDataHandler(metaData, sb);

      return sb.toString();
    },
  })
    .addMetaData(DEFAULT_META_DATA.issue)
    .addWarning({
      warningAsync: async (report) => {
        const { metaData } = report;
        const w: IWarning[] = [];

        const issue = metaData['issue:'];
        if (issue && issue.includes('github')) {
          await githubIssueHandler(issue, w);
        }

        return { hasWarning: !!w.length, warnings: w };
      },
    });
};

export const sensitiveAnnotationHandler = (b: configBuilder) => {
  b.addAnnotation({
    key: '-flaky',
    printMessage: (report) => {
      const { metaData, status, file, context, key, line } = report;
      let sb = new StringBuilder();

      defaultHandlers(report, sb);

      return sb.toString();
    },
    settings: { acceptStatus: false, caseSensitive: false },
  });
};

export const flakyAnnotationHandler = (b: configBuilder) => {
  b.addAnnotation({
    key: '-sensitive',
    settings: { acceptStatus: false, caseSensitive: false },
    printMessage: (report) => {
      let sb = new StringBuilder();

      defaultHandlers(report, sb);

      return sb.toString();
    },
  });
};

export const contextHandler = (context: IContext, sb: StringBuilder) => {
  const { lineIndex, name, type } = context;
  if (type !== 'no_context') {
    sb.addLine('Context:\n' + `\tName: ${name}\n` + `\tType: "${type}"\n` + `\tline: ${lineIndex}\n`);
  } else {
    sb.addLine(`Context: No context found, make sure you placed your flag correctly\n`);
  }
};

export const metaDataHandler = (metaData: object, sb: StringBuilder) => {
  if (!metaData) return;
  sb.addLine(`Meta Data:\n`);
  for (const metaDataKey in metaData) {
    const metaDataDetails = metaData[metaDataKey] as string;
    sb.addLine(`\t${metaDataKey}:\n`);
    sb.addLine(
      '\t\t' +
        strUtils
          .splitToLines(metaDataDetails)
          .map((m) => m.trim())
          .join('\n\t\t')
    );
    sb.addNewLine('');
  }
};

export const fileHandler = (fileDetails: { file: string; line: number; status: string; key: string }, sb: StringBuilder) => {
  const { file, line, status, key } = fileDetails;
  sb.addLine(`File: ${file} line: ${line}\n` + `Key: ${key}\n` + `Status: ${status}\n`);
};

export const defaultHandlers = (report: Partial<IReport>, sb: StringBuilder) => {
  const { metaData, status, file, context, key, line } = report;

  fileHandler({ file, line, status, key }, sb);
  contextHandler(context, sb);
  metaDataHandler(metaData, sb);
};
