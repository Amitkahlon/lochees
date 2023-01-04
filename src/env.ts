import * as fs from 'fs';

/**
 * Singleton class
 */
export class EnvManger {
  public flags: {
    full: boolean;
    output: string;
    full_error: boolean;
    github_access_token?: string;
    only_warnings: boolean;
    scanDirectory: string;
  };

  private argv: string[];

  private static _instance: EnvManger;

  private constructor() {}

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  public build(args: string[]) {
    
    this.argv = args;
    this.flags = { full: false, output: 'console', full_error: false, only_warnings: false, scanDirectory: null };
    this.setFlags();
  }

  private setFlags() {
    this.handleScanFiles();
    this.handleFullFlag();
    this.handleOutput();
    this.handleGithubAuth();
    this.fullErrorFlag();
    this.handleOnlyWarning();
  }

  handleScanFiles() {
    const path = this.argv[0];
    if (!fs.existsSync(path) || !fs.lstatSync(this.argv[0]).isDirectory) {
      throw 'please provide a path for the directory you want to scan';
    }

    this.flags.scanDirectory = path;
  }
  private handleOnlyWarning() {
    this.flags.only_warnings = this.argv.includes('--only-warnings');
  }
  private fullErrorFlag() {
    this.flags.full_error = this.argv.includes('--full-error');
  }
  private handleGithubAuth() {
    for (let i = 0; i < this.argv.length; i++) {
      const arg = this.argv[i];

      if (arg === '--github-auth' || arg === '-gha') {
        const github_access_token = this.argv[i + 1];
        if (!github_access_token || github_access_token.length < 5) {
          console.error('valid github access token was not provided, please provide a valid github access token');
          throw new Error('valid github access token was not provided, please provide a valid github access token');
        }
        this.flags.github_access_token = github_access_token;
        break;
      }
    }
  }

  private handleOutput() {
    for (let i = 0; i < this.argv.length; i++) {
      const arg = this.argv[i];

      if (arg === '-o' || arg === '--output') {
        const output = this.argv[i + 1];
        if (!output) {
          console.error('output was not provided, please provide a file path');
          throw new Error('output was not provided, please provide a file path');
        }
        this.flags.output = output;
        break;
      }
    }
  }

  handleFullFlag() {
    this.flags.full = this.argv.includes('-f') || this.argv.includes('--full');
  }
}
