var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');
var htmlmin = require('gulp-htmlmin');
var minifyInline = require('gulp-minify-inline');
var rename = require("gulp-rename");
var insert = require('gulp-insert');
var bundle = 'polymer-bundle';

var jsname = bundle + '.js';
var htmlname = bundle + '.html';
var minname = bundle + '.min.html';

gulp.task('bootstrap', function() {
  return gulp.src('bower_components/webcomponentsjs/webcomponents-lite.min.js')
          .pipe(rename(jsname))
          .pipe(insert.append(
            'var path = document.querySelector(\'script[src$="' + jsname + '"]\').src.replace(/' + jsname + '$/,\'\');' +
            'document.write(\'<link rel="import" href="\' + path + \'' + minname + '">\');'
          ))
          .pipe(gulp.dest('.'));
});

gulp.task('vulcanize', function () {
	return gulp.src(htmlname)
		.pipe(vulcanize({
			abspath: '',
			stripExcludes: false,
      inlineScripts: true,
      inlineCss: true,
      // TODO: adding 'bower_components/iron-doc-viewer/iron-doc-viewer.html'
      // does not works and prevents including certain things like polymer.html.
      excludes: [
      ]
		}))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true
    }))
    .pipe(minifyInline())
    .pipe(rename(minname))
		.pipe(gulp.dest('.'));
});

gulp.task('default', ['bootstrap', 'vulcanize'], function () {
});
