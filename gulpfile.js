const { task, src, dest, parallel, watch } = require("gulp");
const { createProject } = require("gulp-typescript");
const sass = require("gulp-sass");
const webserver = require("gulp-webserver");
const projectTs = createProject("./tsconfig.json");

task("compile", () => {
    return src("./lib/**/*.ts")
        .pipe(projectTs())
        .pipe(dest("dist/"));
});

task("server", () => {
    return src("./dist").pipe(
        webserver({
            livereload: true,
            open: true,
            fallback: "index.html"
        }),
    );
});

task("sass", () => {
    return src("./lib/style/index.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(dest("dist/"));
});

task("files", () => {
    return src(["./lib/**/*.json", "./lib/**/*.html", "./lib/profile/cv.pdf"]).pipe(dest("dist/"));
});

const tasks = parallel(["compile", "sass", "files"]);

task("watch", () => {
    return watch("./lib/**/*.*", { events: ["ready", "change"] }, tasks);
});
