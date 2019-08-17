var express = require('express');
var path = require('path');
var compression = require('compression');
var nodeadmin = require('nodeadmin');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Sequelize = require('sequelize')

var indexRouter = require('./routes/index');
var subscribersRouter = require('./routes/subscribers');

var app = express();
// const sequelize = new Sequelize('mysql://root:root@localhost:8889/talentdb');
const sequelize = new Sequelize('mysql://root:scoobydoopapa@localhost:3306/talentdb');
const Subscriber = sequelize.define('subscriber', {
  masterapp_id: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  code: {
    type: Sequelize.STRING
  },
  host: {
    type: Sequelize.STRING
  },
  referred_by: {
    type: Sequelize.STRING
  },
  file_path: {
    type: Sequelize.STRING
  },
  created_at: {
    type: Sequelize.DOUBLE
  },
});
// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.set('db', sequelize)
app.set('Subscriber', Subscriber)

app.use(compression())
app.use(nodeadmin(app))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/subscribers', subscribersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  // next(createError(404));
  res.sendFile(path.join(__dirname + '/public/404.html'));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.log(err)
  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

module.exports = app;
