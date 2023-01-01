export class EnvManger {
  public flags: {
    full: boolean;
    output: string;
  };

  private argv: string[];

  constructor(argv: string[]) {
    this.argv = argv;
    this.flags = { full: false, output: 'console' };
    this.setFlags();
  }

  private setFlags() {
    this.handleFullFlag();
    this.handleOutput();
  }

  private handleOutput() {
    for (let i = 0; i < this.argv.length; i++) {
      const arg = this.argv[i];

      if (arg.includes('-o') || arg.includes('--output')) {
        const output = this.argv[i + 1];
        if (!output) {
          console.error('output was not provider, please provide a file path');
          throw new Error('output was not provider, please provide a file path');
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
