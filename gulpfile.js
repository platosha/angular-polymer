var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');
var htmlmin = require('gulp-htmlmin');
var rename = require("gulp-rename");
var insert = require('gulp-insert');
var minifyInline = require('gulp-minify-inline');
var removeHtmlComments = require('gulp-remove-html-comments');
var bundle = 'polymer-bundle';

gulp.task('bootstrap', function() {
  var jsname = bundle + '.js';
  return gulp.src('bower_components/webcomponentsjs/webcomponents-lite.min.js')
          .pipe(rename(jsname))
          .pipe(insert.append(
            'var path = document.querySelector(\'script[src$="' + jsname + '"]\').src.replace(/' + jsname + '.js$/,\'\');' +
            'document.write(\'<link rel="import" href="\' + path + bundle + \'.min.html">\');'
          ))
          .pipe(gulp.dest('.'));
});

gulp.task('vulcanize', function () {
	return gulp.src( bundle + '.html')
		.pipe(vulcanize({
			abspath: '',
			stripExcludes: false,
      inlineScripts: true,
      inlineCss: true,
      stripComments: true,
      // TODO: adding 'bower_components/iron-doc-viewer/iron-doc-viewer.html'
      // does not works and prevents including certain things like polymer.html.
      excludes: [
      ]
		}))
    .pipe(removeHtmlComments())
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(minifyInline())
    .pipe(rename(bundle + ".min.html"))
		.pipe(gulp.dest('.'));
});

gulp.task('default', ['bootstrap', 'vulcanize'], function () {
});
