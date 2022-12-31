// const StrUtils = require("../StrUtils");
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
