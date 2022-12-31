// const fs = require('fs');
// const path = require('path');
// const FileReader = require('./fileReader');
// const StrUtils = require("./StrUtils");

import * as fs from "fs";
import * as path from "path";
import StrUtils from "./StrUtils";
import FileReader from "./FileReader"
import { isCommentLine } from "./logic";
import { AnnotationsManager, metaDataType } from "./annotations";

const strUtils = new StrUtils();
const annotationsManager = new AnnotationsManager({annotations: [{name: "-skip", settings: {acceptStatus: true}, metaData: [{name: "issue",settings: {type: metaDataType.oneLine}}]}]})


const statusFlags = {
  full: false,
};

statusFlags.full = process.argv.includes('-f') || process.argv.includes('--full');
statusFlags.full= false


const stack = ['./test/examples'];


while (stack.length > 0) {
  const currentDir = stack.pop();
  console.log(`Reading folder: ${currentDir}`);

  var absolutePath = path.resolve(currentDir);

  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    const fileStat = fs.lstatSync(filePath);

    if (fileStat.isDirectory()) {
      stack.push(filePath);
    } else {
      console.log(`File: ${filePath}`);
      const fileReader = new FileReader(filePath);

      while(!fileReader.isEndOfFile()) {
        
        if (!isCommentLine(fileReader.currentLineRaw)) {
          continue;
        }




        

        fileReader.nextLine();
      }

      
    }

  }

}