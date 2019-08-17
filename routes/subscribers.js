var express = require ('express');
var multer = require ('multer');
var path = require ('path');
var axios = require ('axios');
var fs = require ('fs');
var router = express.Router ();
var wordsPercentInPDF = require ('../utils/wordsPercentInPDF');

const MAX_NUM_PAGES = 10;
const MAX_PERCENT = 10.0;
const READ_PDF_DELAY = 3000; // ms
const API_TOKEN = '85eed7a70fe3b000b1018855d139c4094d23e391';
// const HOSTING_URL = 'www.talent.tn';
const HOSTING_URL = 'cvbox.talents.tn';
// Set variables
var uuid = 'MFa96da03dfe';
var base_url = 'https://maitreapp.co/api/v2/lists/' + uuid + '/subscribers';
var status_url =
  'https://maitreapp.co/api/v2/lists/' +
  uuid +
  '/subscribers/retrieve_by_email?api_token=' +
  API_TOKEN;
var leaderboard_url =
  'https://maitreapp.co/api/v2/lists/' +
  uuid +
  '/leaderboard?api_token=' +
  API_TOKEN;

var fs = require ('fs');
var storage = multer.diskStorage ({
  destination: function (req, file, cb) {
    cb (null, path.resolve (__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb (null, file.fieldname + '-' + Date.now () + '.pdf');
  },
});

var upload = multer ({
  storage: storage,
  fileFilter: function (req, file, cb) {
    var filetypes = /pdf/;
    var mimetype = filetypes.test (file.mimetype);
    var extname = filetypes.test (
      path.extname (file.originalname).toLowerCase ()
    );

    if (mimetype && extname) {
      return cb (null, true);
    }
    cb (
      'Error: File upload only supports the following filetypes - ' + filetypes
    );
  },
});

function markFileInvalid (pathToFile, email) {
  let filename = path.basename (pathToFile);
  let newPath = path.resolve (
    __dirname,
    '..',
    'invalid-uploads',
    email + '-' + filename.substr (3)
  );
  // console.log('from:', pathToFile, 'to:', newPath)
  fs.renameSync (pathToFile, newPath);
}

function upsert (values, condition, Model) {
  return Model.findOne ({where: condition}).then (function (obj) {
    if (obj) {
      // update
      return obj.update (values);
    } else {
      // insert
      return Model.create (values);
    }
  });
}

function sendToMaitreapp (base_url, payload) {
  return axios.post (base_url, payload).then (function (response) {
    var resObj = response.data;
    var maitreappData = resObj.data;
    if (resObj) {
      if (resObj.status === 'ok') {
        return maitreappData;
      }
    } else {
      throw new Error ('Something went wrong when sending data to maitreapp');
    }
  });
}

function storeToDB (maitreappData, file_path, referral, Subscriber, db) {
  var toUpsert = {
    masterapp_id: maitreappData.id,
    name: maitreappData.name,
    email: maitreappData.email,
    code: maitreappData.code,
    host: 'https://' + HOSTING_URL,
    referred_by: referral,
    file_path: file_path,
    created_at: maitreappData.created_at,
  };
  return db.sync ().then (function () {
    return upsert (
      toUpsert,
      {email: toUpsert.email},
      Subscriber
    ).then (function (justCreated) {
      // console.log ('just created', justCreated.dataValues.email);
      return {
        newSub: true,
        data: toUpsert,
      };
    });
  });
}

function subscribeMofo (db, base_url, payload, file_path, Subscriber) {
  return sendToMaitreapp (base_url, payload)
    .then (function (maitreappData) {
      return storeToDB (
        maitreappData,
        file_path,
        payload.referral,
        Subscriber,
        db
      );
    })
    .then (function (toSend) {
      return toSend;
    });
  // return db.sync ().then (function () {
  //   return Subscriber.findOne ({where: {email: payload.email}}).then (function (
  //     sub
  //   ) {
  //     if (!sub) {
  //     } else {
  //       console.log ('already subbed');
  //       return {
  //         alreadySub: true,
  //         data: sub,
  //       };
  //     }
  //   });
  // });
}

function isPDFValid (result) {
  // percent 0 to account for malformated but valid resumes
  return (
    (result.percent >= MAX_PERCENT || result.percent === 0) &&
    result.numpages <= MAX_NUM_PAGES
  );
}

// let uploadPDF = upload.single ('cv');
// router.post ('/', function (req, res, next) {
//   uploadPDF (req, res, function (err) {
//     if (err) {
//       console.log ('unsupported file, here is request body:', req.body);
//       res.status (400).send ({error: true, message: 'Unsupported file type'});
//     } else {
//       var db = req.app.get ('db');
//       var file = req.file;
//       var Subscriber = req.app.get ('Subscriber');
//       var name = req.body.name;
//       var email = req.body.email;
//       var referral = req.body.mwr;
//       var payload = {
//         api_token: API_TOKEN,
//         hosting_url: HOSTING_URL,
//         email: email,
//         name: name,
//         referral: referral,
//       };
//       var file_path = file ? file.path : null;
//       setTimeout (function () {
//         if (file_path) {
//           wordsPercentInPDF (file_path)
//             .then (function (result) {
//               if (isPDFValid (result)) {
//                 subscribeMofo (db, base_url, payload, file_path, Subscriber)
//                   .then (function (toSend) {
//                     res.json (toSend);
//                   })
//                   .catch (function (err) {
//                     console.log (err);
//                     res.json ('error subscribing', req.body, result);
//                   });
//               } else {
//                 markFileInvalid (file_path, email);
//                 console.log ('mark pdf invalid', req.body, result);
//                 res.send ({invalidFile: true, message: 'Invalid file'});
//               }
//             })
//             .catch (function (error) {
//               console.log (error);
//               markFileInvalid (file_path, email);
//               console.log ('wordsPercentInPDF catch error', req.body);
//               res.send ({invalidFile: true, message: 'Invalid file'});
//             });
//         }
//       }, READ_PDF_DELAY);
//     }
//   });
// });

router.post ('/check', function (req, res, next) {
  // res.send('respond with a resource');
  var email = req.body.email;
  // console.log (status_url + '&email=' + email, req.body);
  axios
    .get (status_url + '&email=' + email)
    .then (function (response) {
      var resObj = response.data;
      var maitreappData = resObj.data;
      // console.log (resObj);
      let toSend = {
        found: false,
        data: null,
      };
      if (resObj) {
        if (resObj.status === 'ok') {
          toSend = {
            found: true,
            data: {
              // host: maitreappData.host,
              host: 'https://' + HOSTING_URL,
              code: maitreappData.code,
              position: maitreappData.position,
              email: maitreappData.email,
              points: maitreappData.points,
            },
          };
        }
      }
      // res.json (toSend);
      return toSend
    })
    .then(function (toSend) {
      axios
        .get(leaderboard_url)
        .then(function (response) {
          let topSubs = response.data.data.ranking.slice(0, 3)
          toSend.data.topSubs = topSubs.map(function (sub) {
            return ({
              email: sub.email === email ? email : hideEmail(sub.email),
              points: sub.points,
              position: sub.position
            })
          })
          res.send(toSend)
        })
        .catch(function (error) { throw error })
    })
    .catch (function (error) {
      console.log ('error', error.data, email);
      toSend = {
        found: false,
        data: null,
      };
      res.json (toSend);
      // res.json ({status: 'error', message: 'error during api call'});
    });
});

function hideEmail (s) { return s.substr(0, 4) + '***********' + s.substr(s.length - 4, 4)}

module.exports = router;
