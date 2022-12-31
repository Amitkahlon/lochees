const StrUtils = require("./StrUtils");
const strUtils = new StrUtils();


const isCommentLine = (line) => {
  return line.startsWith('//');
};

const getFirstWord = (words) => {
  if(!words) return null;

  let i = 0;
  while(i < words.length) {
    const curr = trimCommentSign(words[i]);

    if(curr) return curr;
  }

  return null;
}




module.exports = {
  isCommentLine,
  getFirstWord
}