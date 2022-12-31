class StrUtils { 
  splitToWords(line) {
    return line?.split(/\s+/);
  };

  splitToLines(contents) {
    return contents.split('\n');
  }

  trimCommentSign = (word) => {
    for (let z = 0; z < word.length; z++) {
      if (word[z] === '/') {
        continue;
      }
  
      return word.slice(z);
    }
  };
}

module.exports = StrUtils;