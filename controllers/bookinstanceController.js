const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find().populate('book').exec(function(err, list_bookinstances) {
        if (err) { return next(err); }

        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id).populate('book').exec(function(err, results) {
        if (err) { return next(err); }
        if (results==null) { // No results
            const err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('bookinstance_detail', { title: 'Copy: ' + results.book.title, bookinstance: results });
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({}, 'title').exec(function(err, books) {
        if (err) { return next(err); }

        res.render('bookinstance_form', { title: 'Create Bookinstance', book_list: books });
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    
    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const _bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title').exec(function(err, books) {
                if (err) { return next(err); }
                // Successful, so render
                res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: _bookinstance.book._id, errors: errors.array(), bookinstance: _bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            _bookinstance.save(function(err) {
                if (err) { return next(err); }
                // Successful - redirect to new record.
                res.redirect(_bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }

        if (results.bookinstance == null) {
            res.render('/catalog/bookinstances');
        }

        // Successfull, so render
        res.render('bookinstance_delete', { title: 'Delete Bookinstance', bookinstance: results.bookinstance });
    })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.body.bookinstanceid).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }

        // Success
        BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err) {
            if (err) { return next(err); }

            // Success - go to the bookinstance list
            res.redirect('/catalog/bookinstances');
        })
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },
        books: function(callback) {
            Book.find(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }

        if (results.bookinstance == null) {
            const err = new Error('Bookinstance not found');
            err.status = 404;
            return next(err);
        }

        res.render('bookinstance_form', { title: 'Update Bookinstance', book_list: results.books, selected_book: results.bookinstance.book._id, bookinstance: results.bookinstance })
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const _bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title').exec(function(err, books) {
                if (err) { return next(err); }
                // Successful, so render
                res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: _bookinstance.book._id, errors: errors.array(), bookinstance: _bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            BookInstance.findByIdAndUpdate(req.params.id, _bookinstance, {}, function(err, theBookinstance) {
                if (err) { return next(err); }
                // Successful - redirect to new record.
                res.redirect(theBookinstance.url);
            });
        }
    }
];