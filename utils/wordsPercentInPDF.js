const wordFreq = require ('./word-freq');
const fs = require ('fs');
const pdf = require ('pdf-parse');
const LanguageDetect = require('languagedetect');
const keywords = require('./cv-keywords');
const lngDetector = new LanguageDetect();
// let path = 'uploads/sample.pdf';
// let dataBuffer = fs.readFileSync (path);

// pdf (dataBuffer).then (function (data) {
//   let words = ['simple', 'more', 'and'];
//   // // number of pages
//   // console.log(data.numpages);
//   // // number of rendered pages
//   // console.log(data.numrender);
//   // // PDF info
//   // console.log(data.info);
//   // // PDF metadata
//   // console.log(data.metadata);
//   // // PDF.js version
//   // // check https://mozilla.github.io/pdf.js/getting_started/
//   // console.log(data.version);
//   // // PDF text
//   // console.log(data);
//   console.log ('pdf parsed');
//   wordFreq (words, data.text, function (wordsCountObj) {
//     let totalWords = data.text.split (' ').length;
//     let wordsCount = cummulateWordCount (wordsCountObj);
//     let percent = parseFloat ((wordsCount / totalWords * 100).toFixed (2));
//     console.log ('percentage:', percent);
//     console.log ('words', data.text.split (' ').length);
//     console.log (wordsCountObj);
//   });
// });

function cummulateWordCount (wordsCountObj) {
  let result = 0;
  for (const word in wordsCountObj) {
    if (wordsCountObj.hasOwnProperty (word)) {
      const count = wordsCountObj[word];
      // result += count;
      result+= count > 0 ? 1 : 0;
    }
  }
  return result;
}

module.exports = function wordsPercentInPDF (pathToFile) {
  return new Promise (function (resolve, reject) {
    try {
      let dataBuffer = fs.readFileSync (pathToFile);
      pdf (dataBuffer)
        .then (function (data) {
          // console.log ('pdf parsed');
          let detectedLangs = lngDetector.detect(data.text)
          let lang = detectedLangs.length === 0 ? null : detectedLangs[0][0]
          console.log(lang)
          // console.log(lang)
          // console.log(data.text)
          // let kw = keywords[lang]
          let kw = keywords['english']
          if (lang === 'arabic') {
            resolve({
              wordsCountObj: {s: 1},
              wordsCount: 1,
              totalCount: 1,
              percent: 100,
              numpages: data.numpages
            })
          } else {
            let ss = wordFreq (kw, data.text, function (wordsCountObj) {
              // let totalCount = data.text.split (' ').length;
              let totalCount = kw.length;
              let wordsCount = cummulateWordCount (wordsCountObj);
              let percent = parseFloat (
                (wordsCount / totalCount * 100).toFixed (2)
              );
              let result = {
                wordsCountObj: wordsCountObj,
                wordsCount: wordsCount,
                totalCount: totalCount,
                percent: percent,
                numpages: data.numpages,
              };
              resolve (result);
            });
          }
        })
        .catch (function (error) {
          reject (error);
        });
    } catch (error) {
      reject (error);
    }
  });
};

// // example of usage

// let cvname = 'cv-1535548947012'
// let path = '/Users/tayara-pc-1/Documents/invalid-uploads/'+cvname+'.pdf';
// // let path = '/Users/tayara-pc-1/projects/talent-campain/uploads/cv-1533814082550.pdf'
// // let path = '/Users/tayara-pc-1/projects/talent-campain/uploads/cv-1533814484877.pdf'
// // // let path = '/Users/tayara-pc-1/projects/talent-campain/uploads/sample.pdf'
// // let words = ['أعزب'];

// wordsPercentInPDF(path)
//   .then(function (result) {
//     console.log(result)
//   })
//   .catch(function (err) { console.log(err) })
