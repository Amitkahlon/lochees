import { IReport } from './model/interfaces';

export class ReportManager {
  public simpleReport: object;
  public fullReport: Partial<IReport>[];
  constructor(isFull: boolean) {
    if (isFull) {
      this.fullReport = [];
    } else {
      this.simpleReport = {};
    }
  }
}
