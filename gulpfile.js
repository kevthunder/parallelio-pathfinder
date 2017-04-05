var gulp = require('gulp');
var rename = require("gulp-rename");
var coffee = require('gulp-coffee');
var uglify = require('gulp-uglify');
var mocha = require('gulp-mocha');

gulp.task('coffee', function() {
  gulp.src('./src/*.coffee')
    .pipe(coffee())
    .pipe(rename('pathfinder.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('coffeeTest', function() {
  gulp.src('./test/src/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('./test/'));
});

gulp.task('compress', ['coffee'], function () {
  gulp.src('./dist/pathfinder.js')
    .pipe(uglify())
    .pipe(rename('pathfinder.min.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['coffee', 'compress'], function () {
    console.log('Build Complete');
});

gulp.task('test', ['coffee','coffeeTest'], function() {
  gulp.src('./test/pathfinder.js')
    .pipe(mocha());
});

gulp.task('default', ['build']);