const gulp = require('gulp');
const del = require('del');
const assetsPath = 'www/';
const iosAssetsPath = 'platforms/ios/www/';
const iosAssetsCommonPath = 'platforms/ios/platform_www/';
const androidAssetsPath = 'platforms/android/app/src/main/assets/www/';
const androidAssetsCommonPath = 'platforms/android/platform_www/';

gulp.task('clean', () => del([iosAssetsPath + '**', androidAssetsPath + '**']));

gulp.task('sync-ios-assets', () => 
    gulp.src([iosAssetsCommonPath + '**', assetsPath + '**']).pipe(gulp.dest(iosAssetsPath)));

gulp.task('sync-android-assets', () => 
    gulp.src([androidAssetsCommonPath + '**', assetsPath + '**']).pipe(gulp.dest(androidAssetsPath)));

gulp.task('default', gulp.parallel('sync-ios-assets', 'sync-android-assets'));
