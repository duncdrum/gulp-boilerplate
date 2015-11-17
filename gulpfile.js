var gulp       = require('gulp'),
  gConfig      = require('./gulp-config'),
  browserSync  = require('browser-sync'),
  opts         = gConfig.pluginOpts,
  plugins      = require('gulp-load-plugins')(opts.load),
  isDist       = (plugins.gUtil.env.dist)    ? true: false,
  isDev        = (plugins.gUtil.env.dev)     ? true: false,
  isDeploy     = (plugins.gUtil.env.deploy)  ? true: false,
  isMapped     = (plugins.gUtil.env.map)     ? true: false,
  isStat       = (plugins.gUtil.env.stat)    ? true: false,
  sources      = gConfig.paths.sources,
  destinations = gConfig.paths.destinations;

/*
  serve; creates local static livereload server using browser-sync.
*/
gulp.task('serve', ['build:complete'], function(event) {
  browserSync(opts.browserSync);
  return gulp.watch(sources.overwatch).on('change', function(file) {
    if (file.path.indexOf('.css') === -1) browserSync.reload();
  });
});

/*
  coffee:compile/coffee:watch

  watch for changes to CoffeeScript files then compile app JavaScript file
  from source, concatenating and uglifying content and publishing output based on env flag. For example, if we want sourcemaps we can output our individual JS files and the sourcemap for them to the desired directory by using the --map flag.
*/
gulp.task('coffee:lint', function() {
  return gulp.src(sources.coffee)
    .pipe(plugins.coffeeLint())
    .pipe(plugins.coffeeLint.reporter());
});
gulp.task('coffee:compile', ['coffee:lint'], function(event) {
  return gulp.src(sources.coffee)
    .pipe(plugins.plumber())
    .pipe(plugins.coffee(opts.coffee))
    .pipe(isMapped ? gulp.dest(destinations.js): plugins.gUtil.noop())
    .pipe(isMapped ? plugins.sourcemaps.init(): plugins.gUtil.noop())
    .pipe(plugins.concat(gConfig.pkg.name + '.js'))
    .pipe(plugins.wrap(opts.wrap))
    .pipe(isStat ? plugins.size(opts.gSize): plugins.gUtil.noop())
    .pipe(isDeploy ? plugins.gUtil.noop(): gulp.dest(isDist ? destinations.dist: destinations.js))
    .pipe(plugins.uglify())
    .pipe(plugins.rename(opts.rename))
    .pipe(isMapped ? plugins.sourcemaps.write('./'): plugins.gUtil.noop())
    .pipe(isStat ? plugins.size(opts.gSize): plugins.gUtil.noop())
    .pipe(gulp.dest(isDist ? destinations.dist: destinations.js));
});
gulp.task('coffee:watch', function(event) {
  gulp.watch(sources.coffee, ['coffee:compile']);
});

/*
  stylus:compile/stylus:watch

  watch for changes to stylus files then compile stylesheet from source
  auto prefixing content and generating output based on env flag.
*/
gulp.task('stylus:lint', function() {
  return gulp.src(sources.stylus)
    .pipe(plugins.stylint())
    .pipe(plugins.stylint.reporter());
});
gulp.task('stylus:compile', function(event) {
  return gulp.src(sources.stylus)
    .pipe(plugins.plumber())
    .pipe(plugins.concat(gConfig.pkg.name + '.stylus'))
    .pipe(plugins.stylus())
    .pipe(isStat ? plugins.size(opts.gSize): plugins.gUtil.noop())
    .pipe(isDeploy ? plugins.gUtil.noop(): gulp.dest(isDist ? destination.dist: destinations.css))
    .pipe(plugins.prefix(opts.prefix))
    .pipe(plugins.minify())
    .pipe(plugins.rename(opts.rename))
    .pipe(isStat ? plugins.size(opts.gSize): plugins.gUtil.noop())
    .pipe(gulp.dest(isDist ? destination.dist: destinations.css))
    .pipe(browserSync.stream());
});
gulp.task('stylus:watch', function(event) {
  gulp.watch(sources.stylus, ['stylus:compile']);
});

/*
  jade:compile/jade:watch

  watch for all jade file changes then compile
  page document files.
*/
gulp.task('jade:compile', function(event) {
  return gulp.src(sources.docs)
    .pipe(plugins.plumber())
    .pipe(isDeploy ? plugins.jade(): plugins.jade(opts.jade))
    .pipe(gulp.dest(destinations.html));
});
gulp.task('jade:watch', function(event){
  gulp.watch(sources.jade, ['jade:compile']);
});

gulp.task('deploy:ghpages', ['build:complete'], function(event) {
  isDeploy = true;
  return gulp.src(sources.overwatch)
    .pipe(plugins.deploy());
});

gulp.task('build:complete', [
  'jade:compile',
  'stylus:compile',
  'coffee:compile'
]);

gulp.task('watch', [
  'jade:watch',
  'stylus:watch',
  'coffee:watch'
]);

var defaultTasks = isDeploy ? [
  'deploy:ghpages'
]:[
  'serve',
  'watch'
];

gulp.task('default', defaultTasks);
