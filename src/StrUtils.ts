export default class StrUtils {
  splitToWords(line) {
    return line?.split(/\s+/);
  }

  splitToLines(contents) {
    return contents.split('\n');
  }

  trimCommentSign = (word): string => {
    for (let z = 0; z < word.length; z++) {
      if (word[z] === '/') {
        continue;
      }

      return word.slice(z);
    }
  };

  isWhiteSpace(str: string) {
    if (!str.replace(/\s/g, '').length) {
      return true;
    }
    return false;
  }

  formatObject(obj: object) {
    return JSON.stringify(obj, null, 2);
  }

}
