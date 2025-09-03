/* eslint-disable camelcase */
const admin = require("firebase-admin");

admin.initializeApp();

// modules
const adminMod = require("./modules/admin");
const themes = require("./modules/themes");
const boards = require("./modules/boards");
const media = require("./modules/media");
const http = require("./modules/http");

// === Admin
exports.setUserRole = adminMod.setUserRole;

// === Themes
exports.onThemeAssetUpload = themes.onThemeAssetUpload;
exports.adminUpsertTheme = themes.adminUpsertTheme;
exports.adminDeleteTheme = themes.adminDeleteTheme;
exports.publishLoginThemes = themes.publishLoginThemes;
exports.nightlyThemeArchiver = themes.nightlyThemeArchiver;
exports.onThemeDocDelete = themes.onThemeDocDelete;

// === Boards
exports.onBoardItemCreate = boards.onBoardItemCreate;
exports.onBoardItemDelete = boards.onBoardItemDelete;
exports.boardsTrackEvent = boards.boardsTrackEvent;
exports.boardsDaily = boards.boardsDaily;

// === Media
exports.removeBgPro = media.removeBgPro;

// === HTTP (if you expose anything there)
exports.http = http;
