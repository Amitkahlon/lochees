const fs = require('fs');
const path = require('path');

console.log(process.execArgv);

const statusFlags = {
  full: false,
};

statusFlags.full = process.argv.includes('-f') || process.argv.includes('--full');
statusFlags.full= true


const FLAGS = {
  skip: '-skip',
  sensitive: '-sensitive',
  plaster: '-plaster',
  flaky: '-flaky',
};

const ANNOTATION = {
  notes: 'notes:',
  issue: 'issue:',
  todo: 'todo:',
};

const SKIP_STATUS = {
  bug: 'bug',
  bug_missing_issue: 'bug, missing issue',
  wip: 'wip',
  broken: 'broken',
  deprecated: 'deprecated',
};

const flags = [FLAGS.skip, FLAGS.sensitive, FLAGS.plaster, FLAGS.flaky];
const paths = { e2e: './cypress/e2e', support: './cypress/support', utils: './cypress/test-utils' };

let flagIdCounter = 0;

const flagsMap = {};
if (statusFlags.full) {
  flagsMap[FLAGS.skip] = [];
  flagsMap[FLAGS.plaster] = [];
  flagsMap[FLAGS.sensitive] = [];
  flagsMap[FLAGS.flaky] = [];
}

const isCommentLine = (line) => {
  return line.startsWith('//');
};

const getFlag = (word) => {
  if (!word) return;

  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];

    if (word.toLowerCase().includes(flag)) return flag;
  }

  return null;
};

const isAnnotation = (word) => {
  const lower = word.toLowerCase();
  return lower === ANNOTATION.issue || lower === ANNOTATION.notes || lower === ANNOTATION.todo;
};

const splitToWords = (line) => {
  return line?.split(/\s+/);
};

const trimCommentSign = (word) => {
  for (let z = 0; z < word.length; z++) {
    if (word[z] === '/') {
      continue;
    }

    return word.slice(z);
  }
};

const getFirstWord = (wordsArr) => {
  let i = 0;
  while (i < wordsArr?.length) {
    const trimmedWord = trimCommentSign(wordsArr[i])?.trimStart();
    if (trimmedWord) {
      return { word: trimmedWord, index: i };
    }
    i++;
  }

  return null;
};

const getFirstFlag = (wordsArr) => {
  // Problem: "//-skip" or "////-skip" or "// -skip"
  // Solution: Find the last '/' from the start.
  //Trim the comments from the first word.

  const first = getFlag(trimCommentSign(wordsArr[0]));
  const second = getFlag(wordsArr[1]);

  if (first) return first;
  else if (second) return second;
  else return null;
};

const handleMultiLineAnnotation = (firstWords, currentLineIndex, firstWordIndex, lines) => {
  let multiLine = firstWords.slice(firstWordIndex + 1).join(' ');

  let lineIndex = currentLineIndex + 1;
  while (lineIndex < lines.length) {
    if (!isCommentLine(lines[lineIndex])) {
      break;
    }

    const words = splitToWords(lines[lineIndex]);

    const firstWordDetails = getFirstWord(words);
    const firstWord = firstWordDetails.word;
    if (isAnnotation(firstWord)) {
      break;
    }

    multiLine += '\n' + words.slice(firstWordDetails.index);
    lineIndex++;
  }

  return {multiLine, newIndex: lineIndex};
};

(() => {
  // const stack = [paths.e2e, paths.utils, paths.support];
  const stack = ['./script-test'];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    console.log(`Reading folder: ${currentDir}`);

    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const fileStat = fs.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        stack.push(filePath);
      } else {
        console.log(`File: ${filePath}`);

        const fileData = fs.readFileSync(filePath);
        const contents = fileData.toString();

        const lines = contents.split('\n');
        const trimmedLines = lines.map((line) => line.trim());

        for (let i = 0; i < trimmedLines.length; i++) {
          const line = trimmedLines[i];

          if (!isCommentLine(line)) {
            continue;
          }

          const words = splitToWords(line);
          let flag = getFirstFlag(words);

          //if no flag word found, continue to the next line
          if (!flag) {
            continue;
          }

          if (statusFlags.full) {
            let status;
            let unknownStatusFlag = true;

            //handle skip flag, find its status
            if (flag === FLAGS.skip) {
              const rawStatus = words.slice(2).join(' ');
              for (let key in SKIP_STATUS) {
                if (rawStatus.toLowerCase().includes(SKIP_STATUS[key])) {
                  status = SKIP_STATUS[key];
                  unknownStatusFlag = false;
                  break;
                }
              }

              if (unknownStatusFlag) {
                status = rawStatus;
              }
            }


            const extra = {
              issue: null, 
              notes: null,
              todo: null
            }

            //TODO: Change to continue from the last line index, atm its recheck lines that are part of a multi line annotation
            const checkForAnnotation = () => {
              let currentLineIndex = i + 1;
              if (!isCommentLine(lines[currentLineIndex])) return; //TODO: Maybe ignore empty lines

              let nextLine = lines[currentLineIndex];
              let nextLineWords = splitToWords(nextLine);

              let firstWordDetails = getFirstWord(nextLineWords);
              if (firstWordDetails.word === ANNOTATION.issue) {
                extra.issue = nextLineWords[firstWordDetails.index + 1];

                //move to the next line, issue is one liner.
                currentLineIndex++;
                nextLine = lines[currentLineIndex];
                nextLineWords = splitToWords(nextLine);
                firstWordDetails = getFirstWord(nextLineWords);
              }

              if (firstWordDetails.word === ANNOTATION.notes) {
                const {multiLine, newIndex} = handleMultiLineAnnotation(nextLineWords, currentLineIndex, firstWordDetails.index, lines);
                extra.notes = multiLine;

                currentLineIndex = newIndex;
                nextLine = lines[currentLineIndex];
                nextLineWords = splitToWords(nextLine);
                firstWordDetails = getFirstWord(nextLineWords);
              }

              if (firstWordDetails.word === ANNOTATION.todo) {
                const {multiLine, newIndex} = handleMultiLineAnnotation(nextLineWords, currentLineIndex, firstWordDetails.index, lines);
                extra.todo = multiLine;

                currentLineIndex = newIndex;
                nextLine = lines[currentLineIndex];
                nextLineWords = splitToWords(nextLine);
                firstWordDetails = getFirstWord(nextLineWords);
              }
            };

            checkForAnnotation();

            flagsMap[flag] = {
              id: flagIdCounter++,
              flag,
              notes: extra.notes,
              issueLink: extra.issue,
              status: status,
              unknownStatus: unknownStatusFlag,
              todo: extra.todo,
            };
          } else {
            if (flagsMap[flag] == null) {
              flagsMap[flag] = 1;
            } else {
              flagsMap[flag]++;
            }
          }
        }
      }
    }
  }

  console.log('====== Results: ===== \n \n');

  if (statusFlags.full) {
    console.log(flagsMap);
  } else {
    console.log(`Total skipped Tests: ${flagsMap[FLAGS.skip]} \n\n`);

    console.log(
      `Total plasters used in the tests: ${flagsMap[FLAGS.plaster]} ${
        flagsMap[FLAGS.plaster] > 3 ? '\n~THE PROJECT IS BLEEDING!! GET THE MEDIC GOD DAMMIT~' : ''
      } \n\n`
    );

    console.log(`Total sensitive Tests: ${flagsMap[FLAGS.sensitive]} \n\n`);

    console.log(`Total flaky Tests: ${flagsMap[FLAGS.sensitive]} \n\n`);
  }
})();
