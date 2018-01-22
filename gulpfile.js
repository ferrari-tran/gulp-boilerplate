var gulp 						= require('gulp'),
	argv 						= require('yargs').argv, // watching when start gulp
	browserSync 				= require('browser-sync'); // sync all browser when run gulp
	
var path = {
	source: './src',
	output: './dist'
};

gulp.task('html', () => {
	return gulp.src(path.source + '/*.html');
});

// Tast: Watching task when start gulp
gulp.task('watch', () => {
	var port = argv.port || 8888;

	browserSync({
		notify: false,
		port: port,
		server: {
			baseDir: path.output
		},
		ui: {
			port: 8080
		}
	});

	gulp.watch([path.source + '/index.html'], ['html']);
});

// Task: DEFAULT
gulp.task('default', ['html', 'watch']);
