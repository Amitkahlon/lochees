const StrUtils = require("./StrUtils");
const strUtils = new StrUtils();


const isCommentLine = (line) => {
  return line.startsWith('//');
};

const getFirstWord = (words) => {
  let i = 0;
  while(true) {
    const curr = trimCommentSign(words[i]);

    if(curr) return curr;

  }
  
  

}


module.exports = {
  isCommentLine
}