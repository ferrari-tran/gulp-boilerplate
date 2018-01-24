var gulp 						= require('gulp'),
	ejs 						= require('gulp-ejs'), 						// language ejs
	log 						= require('fancy-log'), 					// log error for ejs
	argv 						= require('yargs').argv, 					// watching when start gulp
	inject 						= require('gulp-inject'), 					// auto add file vendor to page
	config 						= require('./build.config.json'), 			// link file vendors
	browserSync 				= require('browser-sync'), 					// sync all browser when run gulp
	reload 						= browserSync.reload; 						// reload page if change
	
var path = {
	source: './src',
	output: './dist',
	vendors: './src/assets/vendors',
	module: './node_modules'
};


/**
 * ===============================================================
 * Task: EJS
 * ===============================================================
 */
gulp.task('ejs', () => {
	return gulp.src(path.source + '/pages/*.ejs')
		.pipe(ejs({},{}, {ext: '.html'}).on('error', log))
	    .pipe(gulp.dest(path.output))
	    .pipe(reload({stream: true}));
});


/**
 * ===============================================================
 * Task: COPY
 * ===============================================================
 */
gulp.task('copy', () => {
	return gulp.src(config.src)
		.pipe(gulp.dest(path.vendors))
		.pipe(reload({stream: true}));;
});



/**
 * ===============================================================
 * Task: INJECT - Auto add link file vendors to page
 * ===============================================================
 */
gulp.task('inject', () => {
	let target = gulp.src(path.source + '/partials/*.ejs');
	let sources = gulp.src([path.vendors + '/*.js', path.vendors + '/*.css'], { read: false });
	
	return target.pipe(inject(sources))
		.pipe(gulp.dest(path.source + '/partials'))
		.pipe(reload({stream: true}));;
});



/**
 * ===============================================================
 * Task: Watching task when start gulp
 * ===============================================================
 */
gulp.task('watch', () => {
	var port = argv.port || 8888;

	browserSync({
		notify: false,
		port: port,
		server: {
			baseDir: path.output
		},
		ui: {
			port: 8080 // port for dashboard of browserSync
		}
	});

	gulp.watch([path.source + '/**/*.ejs'], ['ejs', 'inject']);
	gulp.watch(['./build.config.json'], ['copy', 'inject']);
});


/**
 * ===============================================================
 * Task: DEFAULT
 * ===============================================================
 */
gulp.task('default', ['copy', 'inject', 'ejs', 'watch']);
