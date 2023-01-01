// -skip bug - no open issue
//notes: notes line 1.
// line 2.
// line 3.
//todo: todo line 1
// todo line 2
// -plaster
// notes: plaster notes 1
// plaster notes 2

describe.skip('text', () => {
  // -skip bug
  // issue: "https://github.com/cypress-io/cypress/issues/25284"

  it('it 1', () => {});

  // -skip bug
  // issue: "www.google.com"

  it('it 2', () => {});
});

//-skip
//notes: notes for test1

//test1()
