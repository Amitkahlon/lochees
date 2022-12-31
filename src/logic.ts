import { AnnotationsManager, IAnnotationConfig, IMetaData } from "./annotations";
import FileReader from "./FileReader"
import StrUtils from "./StrUtils";

const strUtils = new StrUtils();

export const isCommentLine = (line) => {
  return line.startsWith('//');
};

export const getFirstWord = (words) => {
  if(!words) return null;

  let i = 0;
  while(i < words.length) {
    const curr = strUtils.trimCommentSign(words[i]);

    if(curr) return curr;
  }

  return null;
}

/**
 * Checks for a flag in a sentence, returns null if not found
 */
export const getAnnotation = (fileReader: FileReader, manager: AnnotationsManager) => {
    // Problem: "//-skip" or "////-skip" or "// -skip"
  // Solution: Find the last '/' from the start.
  //Trim the comments from the first word.

  const first = manager.getAnnotation(strUtils.trimCommentSign(fileReader.currentWord));
  if(first) return first;
  fileReader.nextWord();
  const second = manager.getAnnotation(fileReader.currentWord);
  if(second) return second;

  return null;
}

export const getMetaData = (fileReader: FileReader, annotation: IAnnotationConfig): IMetaData => {
  const firstWord = strUtils.trimCommentSign(fileReader.currentWord);
  const first = annotation.metaData.find(m => m.key === firstWord);
  if(first) return first;
  
  fileReader.nextWord();
  const second = annotation.metaData.find(m => m.key === fileReader.currentWord);
  if(second) return second;

  return null;
}

export const isEndOfMultiLine = (fileReader: FileReader, annotation: IAnnotationConfig, manager: AnnotationsManager, multiLineIndex: number, maxLines: number) => {
  const isMetaData = !!getMetaData(fileReader, annotation)
  fileReader.goToStart();
  const isAnnotation = !!getAnnotation(fileReader, manager);
  fileReader.goToStart();
  const isComment = isCommentLine(fileReader.currentLineRaw)



  return !isComment || isMetaData || isAnnotation || multiLineIndex >= maxLines
  
}