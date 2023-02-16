/// Imports

// express
const express = require('express');

// http
const createError = require('http-errors');

// html
const { renderFile } = require('ejs');

/// Express application setup

// create application
const app = express();

// configure html view engine
app.engine('html', renderFile);
app.set('view engine', 'html');

// essential middleware setup
app.use(express.json()); // request parser for json
app.use(express.urlencoded({ extended: false })); // request parser for url encoded bodies

app.static = express.static; // mirror express.static to app so it can be overwriten later

// add middleware for proper url, this property should be used to always obtain a consistent url value
app.use((req, res, next) => {
  const params = req.originalUrl.indexOf('?');
  if (params <= 0) req.correctUrl = req.originalUrl;
  else req.correctUrl = req.originalUrl.substring(0, params);
  next();
});

// Switch to asynchronous context to load components
// Note: Semicolon is required to separate this ( from the function returned above
(async () => {
  /// Load components

  // load modules
  await require(process.loader)(app);

  /// Fallback error handler (in case no module caught these beforehand)

  // catch 404 and forward to error handler
  app.use((req, res, next) => next(createError(404)));

  // error handler
  app.use((err) => console.error(toString(err).red));

  /// Emit ready event once setup is done

  app.emit('app.isReady');
})();

/// Export application to server

module.exports = app;
