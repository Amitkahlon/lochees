// const fs = require('fs');
// const path = require('path');
// const StrUtils = require('./StrUtils');

import * as fs from "fs";
import * as path from "path";
import StrUtils from "./StrUtils";

export default class FileReader {
  public currentLineIndex: number = 0;
  currentWordIndex: number = 0;
  private rawContent: string;
  private lines: string[];
  private filePath: string;
  private strUtils = new StrUtils();
  private fileLineLength: number;

  constructor(filePath: string) {
    this.filePath = filePath;
    const fileData = fs.readFileSync(filePath);
    this.rawContent = fileData.toString();
    this.setLines();
  }

  private setLines() {
    this.lines = this.strUtils.splitToLines(this.rawContent);
    this.fileLineLength = this.lines.length;
  }

  public goToWord(index: number) {
    this.currentWordIndex = index;
  }

  public goToStart() {
    this.goToWord(0);
  }


  prevLine() {
    if(this.isEndOfFile()) {
      this.currentLineIndex = this.fileLineLength - 1;
    }
    else if(this.currentLineIndex > 0){
      this.currentLineIndex--;
    }

    this.currentWordIndex = 0;
  }

  nextLine() {
    if(this.currentLineIndex < this.fileLineLength - 1) {
      this.currentLineIndex++;
    } else {
      this.currentLineIndex = -1;
    }

    this.currentWordIndex = 0;
  }

  get currentLine(): string[] {
    return this.strUtils.splitToWords(this.lines[this.currentLineIndex].trim());
  }

  get currentLineRaw() {
    return this.lines[this.currentLineIndex];
  }

  get currentWord() {
    return this.currentLine[this.currentWordIndex];
  } 

  nextWord() {
    if(this.currentWordIndex < this.currentLine.length - 1) {
      this.currentWordIndex++;
    }
  }

  prevWord() {
    if(this.currentWordIndex > 0) {
      this.currentWordIndex--;
    }
  }

  isEndOfFile() {
    return this.currentLineIndex === -1;
  }

  getRestOfLine(from: number) {
    return this.strUtils.trimCommentSign(this.currentLine.slice(from).join(' '));
  }

}
