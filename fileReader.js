const fs = require('fs');
const path = require('path');
const StrUtils = require('./StrUtils');


class FileReader {
  currentLineIndex = 0;
  currentWordIndex = 0;
  rawContent;
  lines;

  strUtils = new StrUtils();

  constructor(filePath) {
    this.filePath = filePath;
    const fileData = fs.readFileSync(filePath);
    this.contents = fileData.toString();
    this.setLines();
  }

  setLines() {
    this.lines = this.strUtils.splitToLines(this.rawContent);
  }


  previous() {
    if(this.currentLineIndex > 0){
      this.currentLineIndex--;
    }
  }

  nextLine() {
    if(this.currentLineIndex <= this.lines.length) {
      this.currentLineIndex++;
    }
  }

  get currentLine() {
    return this.strUtils.splitToWords(this.lines[this.currentLineIndex]);
  }

  get currentLineRaw() {
    return this.lines[this.currentLineIndex];
  }

  get currentWord() {
    return this.currentLine[this.currentWordIndex];
  } 

}


