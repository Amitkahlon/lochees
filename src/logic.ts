import { ConfigManager } from './configManager';
import FileReader from './FileReader';
import { IAnnotationConfig, IMetaDataConfig, contextType } from './model/interfaces';
import StrUtils from './StrUtils';

const strUtils = new StrUtils();

export const isCommentLine = (line) => {
  return line.trim().startsWith('//');
};

export const getFirstWord = (words) => {
  if (!words) return null;

  let i = 0;
  while (i < words.length) {
    const curr = strUtils.trimCommentSign(words[i]);

    if (curr) return curr;
  }

  return null;
};

/**
 * Checks for a flag in a sentence, returns null if not found
 */
export const getAnnotation = (fileReader: FileReader, manager: ConfigManager) => {
  // Problem: "//-skip" or "////-skip" or "// -skip"
  // Solution: Find the last '/' from the start.
  //Trim the comments from the first word.

  const first = manager.getAnnotation(strUtils.trimCommentSign(fileReader.currentWord));
  if (first) return first;
  fileReader.nextWord();
  const second = manager.getAnnotation(fileReader.currentWord);
  if (second) return second;

  return null;
};

export const getMetaData = (fileReader: FileReader, annotation: IAnnotationConfig): IMetaDataConfig => {
  const firstWord = strUtils.trimCommentSign(fileReader.currentWord);
  const first = annotation.metaData.find((m) => m.key === firstWord);
  if (first) return first;

  fileReader.nextWord();
  const second = annotation.metaData.find((m) => m.key === fileReader.currentWord);
  if (second) return second;

  return null;
};

export const isEndOfMultiLine = (
  fileReader: FileReader,
  annotation: IAnnotationConfig,
  manager: ConfigManager,
  multiLineIndex: number,
  maxLines: number
) => {
  const isMetaData = !!getMetaData(fileReader, annotation);
  fileReader.goToStart();
  const isAnnotation = !!getAnnotation(fileReader, manager);
  fileReader.goToStart();
  const isComment = isCommentLine(fileReader.currentLineRaw);

  return !isComment || isMetaData || isAnnotation || multiLineIndex >= maxLines;
};

export const getDescribeName = (line: string) => {
  const regex = /describe\([`'"](.+)[`'"]/;
  const match = line.match(regex);

  if (match) {
    const name = match[1]; // the first capture group
    return name; // prints "random name"
  }
};

export const getItName = (line: string) => {
  const regex = /it\([`'"](.+)[`'"]/;
  const match = line.match(regex);

  if (match) {
    const name = match[1]; // the first capture group
    return name;
  }
};

export const isDescribeLine = (line) => {
  const regex = /describe\([`'"](.+)[`'"]/;
  return regex.test(line);
};

export const isItLine = (line) => {
  const regex = /it\([`'"](.+)[`'"]/;
  return regex.test(line);
};

export const attemptToGetContextType = () => {};

export const attemptToGetContext = (lines: string[]): { name: string; type: contextType; foundIndex: number } => {
  let whiteSpaceCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    if (strUtils.isWhiteSpace(l)) {
      whiteSpaceCount++;

      if (whiteSpaceCount == 2) {
        break;
      }
    }

    let name: string;
    if ((name = getSkippedDescribe(l))) {
      return { name, type: 'skipped_describe', foundIndex: i };
    } else if ((name = getSkippedIt(l))) {
      return { name, type: 'skipped_it', foundIndex: i };
    } else if (isDescribeLine(l)) {
      return { name: getDescribeName(l), type: 'describe', foundIndex: i };
    } else if (isItLine(l)) {
      return { name: getItName(l), type: 'it', foundIndex: i };
    } else if (isFunctionCall(l)) {
      const { name, params } = getFunctionCallName(l); //TODO: use the params
      if (isCommentLine(l)) {
        return { name, type: 'commented_function_call', foundIndex: i };
      } else {
        return { foundIndex: i, name, type: 'function_call' };
      }
    }
  }

  return { name: null, type: 'no_context', foundIndex: null };
};

export const isFunctionCall = (line: string) => {
  const regex = /[^\s]+(\(.+\)?)/;
  return regex.test(line);
};

export const getFunctionCallName = (l): { name: string; params: string } => {
  const regex = /([^\s\/]+)\((.+)?\)/;
  const match = l.match(regex);

  if (match) {
    const name = match[1];
    const params = match[2];
    return { name, params };
  }
};

const getSkippedDescribe = (line: string): string | null => {
  const regex = /describe\.skip\('(.+)',/;
  const match = line.match(regex);

  if (match) {
    return match[1];
  }

  return null;
};

const getSkippedIt = (line: string): string | null => {
  const regex = /it\.skip\('(.+)',/;
  const match = line.match(regex);

  if (match) {
    return match[1];
  }

  return null;
};

//-skip
//notes: bla bla

//commonTests();
