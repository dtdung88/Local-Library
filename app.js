const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

//const bodyParser = require('body-parser');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog'); // Import routes for "catalog" area of site

const compression = require('compression');
const helmet = require('helmet');

const app = express();

app.use(helmet());

// Set up mongoose connection
const mongoose = require('mongoose');

const dev_db_url = 'mongodb+srv://dtdung88:aptx4869@local-library-njnjo.mongodb.net/test?retryWrites=true&w=majority';
const mongoDB_URL = process.env.MONGODB_URI || dev_db_url;

mongoose.connect(mongoDB_URL, { useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error: '));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(compression()); // Compress all routes.

app.use(express.static(path.join(__dirname, 'public')));

//app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter); // Add catalog routes to middleware chain.

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
