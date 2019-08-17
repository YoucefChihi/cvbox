var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Express' });
  res.json('index route')
});

router.get('/count', function(req, res, next) {
  req.app.get('Subscriber').count().then(function (count) {
    var html = '<html><head><title>Count</title></head><body style="height: 100vh; display: flex; justify-content: center; align-items: center; font-size: 5em; font-weight: bold;">'+count+'</body></html>'
    res.send(html)
  })
});

module.exports = router;
