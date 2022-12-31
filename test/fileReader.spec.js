const FileReader = require("../fileReader");
const chai = require("chai");

const expect = chai.expect;

describe('fileReader tests', () => {
  let testReader = new FileReader("C:/Users/AmitKahlon/Desktop/Workplace/project-status/test/example1.ts");

  beforeEach(() => {
    testReader = new FileReader("C:/Users/AmitKahlon/Desktop/Workplace/project-status/test/example1.ts")
  });

    it('get first raw line', () => {
        expect(testReader.currentLineRaw).contain("//-plaster");
    });

    it('get second raw line', () => {
      testReader.nextLine();
      expect(testReader.currentLineRaw).contain('// issue: "www.google.com"');
  });

  it('should get first line', () => {
    expect(testReader.currentLine[0]).to.eq("//-plaster");
  });

  it('should get second line', () => {
    testReader.nextLine();
    expect(testReader.currentLine[0]).to.eq("//");
    expect(testReader.currentLine[1]).to.eq("issue:");
  });

  it('should go back', () => {
    testReader.nextLine()
    testReader.nextLine()
    testReader.previous()

    expect(testReader.currentLineIndex).eq(1);
  });

  it('should not go more than the file length', () => {
    const fileLength = 6;
    for (let i = 0; i < fileLength + 5; i++) {
      testReader.nextLine()
    }

    expect(testReader.currentLineIndex).eq(5);

  });

  it('should not go less than zero', () => {
    for (let i = 0; i < 5; i++) {
      testReader.previous()
    }

    expect(testReader.currentLineIndex).eq(0);
  });


  it('get words', () => {
    testReader.nextLine();
    testReader.nextLine();
    testReader.nextLine();

    expect(testReader.currentWord).to.contain("//");
    testReader.nextWord();
    expect(testReader.currentWord).to.eq("line");
    testReader.nextWord();
    expect(testReader.currentWord).to.eq("2.");
  });

  it('should reach max word', () => {
    testReader.nextLine();
    testReader.nextLine();
    testReader.nextLine();

    for (let i = 0; i < 5; i++) {
      testReader.nextWord();
    }

    expect(testReader.currentWordIndex).eq(2)
  });

});