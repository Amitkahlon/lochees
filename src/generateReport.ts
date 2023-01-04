import { ConfigManager } from './configManager';
import { EnvManger } from './env';
import { actualLog, logWarning, overrideLog } from './logHelper';
import { IReport } from './model/interfaces';

const envManager = EnvManger.Instance;

export const generateFullReport = (reports: IReport[]) => {
  const config = ConfigManager.Instance;

  reports.forEach((r, i) => {
    console.log(`Flag number: ${i}`);
    const annotation = config.getAnnotation(r.key);
    const printedMessage = annotation.printMessage(r);
    console.log(printedMessage);

    if (r.warning && r.warning.hasWarning) {
      r.warning.warnings.forEach((currentWarning) => {
        logWarning(currentWarning.message);
      });
    }

    console.log('\n');
  });
};

export const filterReports = (reports: IReport[]): IReport[] => {
  let filteredReports: IReport[] = [...reports];
  if (envManager.flags.only_warnings) {
    filteredReports = reports.filter((r) => r.warning?.hasWarning);
  }

  return filteredReports;
};

export const generateReport = (reports: IReport[]) => {
  if (envManager.flags.output !== 'console') {
    overrideLog();
  }

  console.log('===================== Report ===================== \n');
  console.log(`Date: ${new Date(Date.now()).toString()}\n`);

  generateFullReport(filterReports(reports));

  console.log('===================== END REPORT ===================== ');

  if (envManager.flags.output !== 'console') {
    actualLog(`Report Finished!\n check your report at ${envManager.flags.output}`);
  }
};
