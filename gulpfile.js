var gulp = require('gulp');
var rename = require("gulp-rename");
var coffee = require('gulp-coffee');
var uglify = require('gulp-uglify-es').default;
var mocha = require('gulp-mocha');
var wrapper = require('spark-wrapper');

gulp.task('coffee', function() {
  return gulp.src('./src/*.coffee')
    .pipe(coffee({bare: true}))
    .pipe(wrapper({namespace:'Parallelio'}))
    .pipe(rename('pathfinder.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('coffeeTest', function() {
  return gulp.src('./test/src/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('./test/'));
});

gulp.task('compress', gulp.series('coffee', function () {
  return gulp.src('./dist/pathfinder.js')
    .pipe(uglify())
    .pipe(rename('pathfinder.min.js'))
    .pipe(gulp.dest('./dist/'));
}));

var build;
gulp.task('build', build = gulp.series('coffee', 'compress', function (done) {
    console.log('Build Complete');
    done();
}));

gulp.task('test', gulp.series('coffee','coffeeTest', function() {
  return gulp.src('./test/tests.js')
    .pipe(mocha());
}));

gulp.task('default', build);