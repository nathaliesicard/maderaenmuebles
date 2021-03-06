var awspublish = require('gulp-awspublish');
var awspublishRouter = require("gulp-awspublish-router");
var co = require('co');
var crawler = require('./build/crawler');
var rimraf = require('rimraf');
var fs = require('fs');
var gulp = require('gulp');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var uglify = require('gulp-uglify');
var minifyHTML = require('gulp-htmlmin');
var sourcemaps = require('gulp-sourcemaps');
var minifyCss = require('gulp-clean-css');
var debug = require('gulp-debug');
var imagemin = require('gulp-imagemin');


var vfs = require('vinyl-fs');

gulp.task('clean', function (cb) {
  rimraf('dist', cb);
});

gulp.task('copy', gulp.series('clean', function() {
  return vfs.src('./public/**', { follow: true })
    .pipe(gulp.dest('dist'));
}));



gulp.task('crawl', gulp.series(function() {
  return crawler()
    .pipe(gulp.dest('dist'));
}));

gulp.task('revision', gulp.series('copy', 'crawl', function() {
  return gulp.src(['dist/**/*.css', '!dist/**/*.min.css', 'dist/**/*.js', '!dist/**/*.min.js'])
    .pipe(debug({ title: 'revisioning' }))
    .pipe(rev())
    .pipe(gulp.dest('dist'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('dist'));
}));

gulp.task('revreplace', gulp.series('revision', function() {
  var manifest = gulp.src("./dist/rev-manifest.json");

  return gulp.src('./dist/**/*.html')
    .pipe(revReplace({manifest: manifest}))
    .pipe(gulp.dest('./dist'));
}));

gulp.task('cssminify', gulp.series(function() {
  return vfs.src(['dist/**/*.css', '!dist/**/*.min.css'])
    .pipe(sourcemaps.init())
    .pipe(minifyCss())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist'));
}));

gulp.task('jsminify', gulp.series(function() {
  return vfs.src(['dist/**/*.js', '!dist/**/*.min.js'])
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist'));
}));

gulp.task('htmlminify', gulp.series(function() {
  return gulp.src('dist/*.html')
    .pipe(minifyHTML({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
}));

gulp.task('imagemin', gulp.series(function() { // writes over the copy..
	return gulp.src(['./public/**/*.jpg', './public/**/*.png'])
		.pipe(imagemin({
			progressive: true
		}))
		.pipe(gulp.dest('dist'));
}));

gulp.task('minify', gulp.series('revreplace', 'cssminify','jsminify', 'htmlminify', 'imagemin'));


gulp.task('deploy', gulp.series('minify', function() {

  var awsOpts = require('./.aws-options.json');

  var publisher = awspublish.create(awsOpts);

  return gulp.src('./dist/**')
    .pipe(awspublishRouter({
      cache: {
        cacheTime: 630720000
      },
      routes: {
        "(\\w+)\\.html$": {
          headers: {
            'Content-Encoding': 'gzip',
            'Content-Type': 'text/html; charset=utf-8'
          },
          key: "$1", // strip the .html
          cacheTime: 600,
          gzip: true
        },
        "\\.(css|map|svg|js|html)$": {
          headers: {
            'Content-Encoding': 'gzip'
          },
          gzip: true
        },
        "^.+$": "$&" // pass through
      }
    }))
    .pipe(debug({ title: 'Deploying: '}))
    .pipe(publisher.publish())
    .pipe(publisher.cache())
    .pipe(awspublish.reporter());

}));


gulp.task('default', gulp.series('minify'));
