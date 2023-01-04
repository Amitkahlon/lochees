
/**
 * this is simply so I will be able to pass string as reference
 */
export class StringBuilder {
  private str: string;

  constructor() {
    this.str = '';
  }

  public addNewLine(line: string) {
    this.str += `\n${line}`;
  }

  public addLine(line: string){
    this.str += line;
  }

  public getString() {
    return this.str;
  }
}
