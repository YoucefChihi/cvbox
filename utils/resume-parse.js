const ResumeParser = require('cv-parser-multiformats');

let path = '../uploads/sample.pdf'

// From file to file
ResumeParser
  .parseResumeFile(path, './files') // input file, output dir
  .then(file => {
    console.log("Yay! " + file);
  })
  .catch(error => {
    console.error(error);
  });