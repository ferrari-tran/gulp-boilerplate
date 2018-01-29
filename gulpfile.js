var gulp                        = require('gulp'),
    ejs                         = require('gulp-ejs'),                      // language ejs
    log                         = require('fancy-log'),                     // log error for ejs
    argv                        = require('yargs').argv,                    // watching when start gulp
    inject                      = require('gulp-inject'),                   // auto add file vendor to page
    sass                        = require('gulp-sass'),                     // compile sass to css
    sassLint                    = require('gulp-sass-lint'),                // check sass
    concat                      = require('gulp-concat'),                   // concatness
    plumber                     = require('gulp-plumber'),                  // continue compile if code is wrong syntax, ...
    autoprefixer                = require('gulp-autoprefixer'),             // auto add prefix to css
    sourcemaps                  = require('gulp-sourcemaps'),               // add file map when minifi
    addSrc                      = require('gulp-add-src'),                  // add link to task
    removeEmptyLines            = require('gulp-remove-empty-lines'),       // remove blank lines
    htmlBeauty                  = require('gulp-html-beautify'),            // remake html beautifier
    uglify                      = require('gulp-uglify'),                   // Minify JavaScript with UglifyJS3
    esLint                      = require('gulp-esLint'),                   // Log bug for javascript
    htmlMin                     = require('gulp-htmlmin'),                  // Minify html
    imagemin                    = require('gulp-imagemin'),                 // Optimize images
    pump                        = require('pump'),                          // require for uglify
    config                      = require('./build.config.json'),           // link file vendors
    browserSync                 = require('browser-sync'),                  // sync all browser when run gulp
    reload                      = browserSync.reload;                       // host review, reload page if change
    
var path = {
    source: './src',
    output: './dist',
    build: './build',
    module: './node_modules'
};
 

/**
 * ===============================================================
 * Task: EJS
 * ===============================================================
 */
gulp.task('ejs', () => {
    return gulp.src([
            path.source + '/*.ejs'
        ])
        .pipe(ejs({},{}, {ext: '.html'}).on('error', log))
        .pipe(gulp.dest(path.output))
        .pipe(reload({stream: true}));
});


/**
 * ===============================================================
 * Task: HTML
 * ===============================================================
 */
gulp.task('html', () => {
    var options = {
        indentSize: 2
    };

    return gulp.src(path.output + '/*.html')
        .pipe(removeEmptyLines())
        .pipe(htmlBeauty(options))
        .pipe(gulp.dest(path.output));
});


/**
 * ===============================================================
 * Task: COPY - copy file vendors, fonts
 * ===============================================================
 */
gulp.task('copy', () => {
    gulp.src(config.src)
        .pipe(gulp.dest(path.output + '/assets/vendors'));
    gulp.src(config.src)
        .pipe(gulp.dest(path.source + '/assets/vendors'));
    gulp.src(path.source + '/assets/fonts/**/*')
        .pipe(gulp.dest(path.output + '/assets/fonts'));
});



/**
 * ===============================================================
 * Task: INJECT - Auto add link file vendors to page
 * ===============================================================
 */
gulp.task('inject', () => {
    return gulp.src(path.source + '/*.ejs')
        .pipe(inject(gulp.src([path.source + '/assets/vendors/*.js', path.source + '/assets/vendors/*.css'], { read: false }), {relative: true}))
        .pipe(gulp.dest(path.source))
        .pipe(reload({stream: true}));
});


/**
 * ===============================================================
 * Task: SASS LINT - Check Sass
 * ===============================================================
 */
gulp.task('sass-lint', () => {
    return gulp.src(path.source + '/assets/sass/**/*.s+(a|c)ss')
        .pipe(plumber())
        .pipe(sassLint())
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError());
});



/**
 * ===============================================================
 * Task: SASS - Compile Sass
 * ===============================================================
 */
gulp.task('compile-sass', ['sass-lint'], () => {
    return gulp.src(path.source + '/assets/sass/*.s+(a|c)ss')
        .pipe(sass().on('error', sass.logError))
        .pipe(addSrc(path.source + '/assets/css/**/*.css'))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.init())
        .pipe(concat('style.css', {newLine: ';'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.output + '/assets/css'))
        .pipe(reload({stream: true}));
});



/**
 * ===============================================================
 * Task: JS LINT - Check javascript
 * ===============================================================
 */
gulp.task('js-lint', () => {
    return gulp.src(path.source + '/assets/js/**/*.js')
        .pipe(esLint({
            globals: [
                'jQuery',
                '$'
            ],
            envs: [
                'browser'
            ],
            configFile: '.eslintrc.json'
        }))
        .pipe(esLint.formatEach('compact', process.stderr));
});



/**
 * ===============================================================
 * Task: Compile js
 * ===============================================================
 */
gulp.task('compile-js', ['js-lint'], () => {
    return gulp.src(path.source + '/assets/js/**/*.js')
        .pipe(plumber())
        .pipe(concat('main.js'))
        .pipe(gulp.dest(path.output + '/assets/js'))
        .pipe(reload({ stream: true }));
});



/**
 * ===============================================================
 * Task: Optimize image
 * ===============================================================
 */
gulp.task('optimize-image', () => {
    return gulp.src(path.source + '/assets/images/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest(path.output + '/assets/images'));
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

    gulp.watch([path.source + '/**/*.ejs'], ['ejs']);
    gulp.watch([path.output + '/*.html'], ['html']);
    gulp.watch(['./build.config.json'], ['copy', 'inject']);
    gulp.watch([path.source + '/assets/sass/*.s+(a|c)ss'], ['compile-sass']);
    gulp.watch([path.source + '/assets/js/**/*.js'], ['compile-js']);
});



/**
 * ===============================================================
 * Task: BUILD - Optimize files
 * ===============================================================
 */
gulp.task('build', (callback) => {
    // Optimize html
    gulp.src(path.output + '/*.html')
        .pipe(htmlMin({ collapseWhitespace: true }))
        .pipe(gulp.dest(path.build));

    // Optimize css
    gulp.src(path.output + '/assets/css/**/*.css')
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest(path.build + '/assets/'));

    // Optimize js
    pump([
        gulp.src(path.output + '/assets/js/**/*.js'),
        uglify(),
        gulp.dest(path.build + '/assets/js')
    ], callback);

    // Copy images
    gulp.src(path.output + '/assets/images/**/*')
        .pipe(gulp.dest(path.build + '/assets/images'));
});



/**
 * ===============================================================
 * Task: DEFAULT
 * ===============================================================
 */
gulp.task('default', ['copy', 'inject', 'ejs', 'html', 'compile-sass', 'compile-js', 'optimize-image', 'watch']);
