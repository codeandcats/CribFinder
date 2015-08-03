var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourceMaps = require('gulp-sourcemaps')
var clean = require('gulp-clean');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');
var runSequence = require('gulp-run-sequence');

gulp.task('clean-client', function() {
	return gulp
		.src([
			'public/**/*.js',
			'public/**/*.map', 
			'!public/libs/**/*.*'],
			{ read: false })
		.pipe(clean());
});

gulp.task('clean-server', function() {
	return gulp
		.src([
			'**/*.js',
			'**/*.map',
			'!node_modules/**/*.*',
			'!public/**/*.*',
			'!gulpfile.js'],
			{ read: false })
		.pipe(clean());
});

var tsProject = ts.createProject('tsconfig.json', { noEmitOnError: false });

gulp.task('build-client', ['clean-client'], function() {
	var tsResult = gulp
		.src([
			'public/**/*.ts',
			'typings/*.ts'],
			{ base: '.' })
		.pipe(ts(tsProject));
		
	var jsResult = tsResult
		.js
		.pipe(gulp.dest('.'));
	
	return jsResult;
});

gulp.task('build-server', ['clean-server'], function() {
	var tsResult = gulp
		.src([
			'**/*.ts',
			'!node_modules/**/*.*'],
			{ base: '.' })
		.pipe(sourceMaps.init())
		.pipe(ts(tsProject));
		
	var jsResult = tsResult
		.js
		.pipe(sourceMaps.write('.'))
		.pipe(gulp.dest('.'));
	
	return jsResult;
});

gulp.task('copy-angular', ['build-client'], function() {
	return gulp
		.src([
			'node_modules/angular/*.js',
			'node_modules/angular/*.map',
			'node_modules/angular-resource/*.js',
			'node_modules/angular-resource/*.map',
			'node_modules/angular-ui-router/build/*.js',
			'node_modules/angular-ui-router/build/*.map'])
		.pipe(gulp.dest('public/libs/angular'));
});

gulp.task('copy-bootstrap', ['build-client'], function() {
	return gulp
		.src('node_modules/bootstrap/dist/**/*.*')
		.pipe(gulp.dest('public/libs/bootstrap'));
});

gulp.task('copy-jquery', ['build-client'], function() {
	return gulp
		.src([
			'node_modules/jquery/dist/**/*.js',
			'node_modules/jquery/dist/**/*.map'])
		.pipe(gulp.dest('public/libs/jquery'))
});

gulp.task('copy-ng-tags-input', ['build-client'], function() {
	return gulp
		.src([
			'node_modules/ng-tags-input/build/**/*.js',
			'node_modules/ng-tags-input/build/**/*.map',
			'node_modules/ng-tags-input/build/**/*.css'])
		.pipe(gulp.dest('public/libs/ng-tags-input'));
});

gulp.task('copy-client-libs', ['copy-angular', 'copy-bootstrap', 'copy-jquery', 'copy-ng-tags-input']);

gulp.task('bundle-client', ['build-client', 'copy-client-libs'], function() {
	return gulp
		.src('public/scripts/app.js')
		.pipe(browserify({
			//ignore: ['angular', 'bootstrap', 'jquery'],
			debug: true
		}))
		.pipe(rename('bundle.js'))
		.pipe(gulp.dest('public/scripts'));
});

gulp.task('build', function() {
	runSequence('bundle-client', 'build-server');
});

gulp.task('default', ['build']);
