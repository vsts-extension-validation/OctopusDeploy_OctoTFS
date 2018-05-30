var gulp = require("gulp");
var path = require("path");
var run = require("gulp-run-command").default;
var clean = require("gulp-clean");
var runSequence = require("run-sequence");

gulp.task("build", (callback) => {
    return runSequence("clean", ["build:tasks", "build:widgets", "build:copy"], callback);
});

gulp.task("build:tasks", [], run("rollup --config rollup.config.js"));
gulp.task("build:widgets", [], () => {
    return gulp.src("source/widgets/**/*")
    .pipe(gulp.dest("dist/widgets"));
})

gulp.task("build:copy", [], () => {
    return gulp.src(["source/*.*", "source/img/**/*.*"], { base: "./source/"})
    .pipe(gulp.dest("dist"));
});

gulp.task("clean", [], () => {
    return gulp.src("dist", {read: false})
    .pipe(clean());
});
