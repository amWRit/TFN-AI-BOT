"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/decamelize";
exports.ids = ["vendor-chunks/decamelize"];
exports.modules = {

/***/ "(rsc)/./node_modules/decamelize/index.js":
/*!******************************************!*\
  !*** ./node_modules/decamelize/index.js ***!
  \******************************************/
/***/ ((module) => {

eval("\nmodule.exports = function(str, sep) {\n    if (typeof str !== \"string\") {\n        throw new TypeError(\"Expected a string\");\n    }\n    sep = typeof sep === \"undefined\" ? \"_\" : sep;\n    return str.replace(/([a-z\\d])([A-Z])/g, \"$1\" + sep + \"$2\").replace(/([A-Z]+)([A-Z][a-z\\d]+)/g, \"$1\" + sep + \"$2\").toLowerCase();\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZGVjYW1lbGl6ZS9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUNBQSxPQUFPQyxPQUFPLEdBQUcsU0FBVUMsR0FBRyxFQUFFQyxHQUFHO0lBQ2xDLElBQUksT0FBT0QsUUFBUSxVQUFVO1FBQzVCLE1BQU0sSUFBSUUsVUFBVTtJQUNyQjtJQUVBRCxNQUFNLE9BQU9BLFFBQVEsY0FBYyxNQUFNQTtJQUV6QyxPQUFPRCxJQUNMRyxPQUFPLENBQUMscUJBQXFCLE9BQU9GLE1BQU0sTUFDMUNFLE9BQU8sQ0FBQyw0QkFBNEIsT0FBT0YsTUFBTSxNQUNqREcsV0FBVztBQUNkIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdGZuLWFpLXZlcmNlbC8uL25vZGVfbW9kdWxlcy9kZWNhbWVsaXplL2luZGV4LmpzPzQyOWMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyLCBzZXApIHtcblx0aWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYSBzdHJpbmcnKTtcblx0fVxuXG5cdHNlcCA9IHR5cGVvZiBzZXAgPT09ICd1bmRlZmluZWQnID8gJ18nIDogc2VwO1xuXG5cdHJldHVybiBzdHJcblx0XHQucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSkvZywgJyQxJyArIHNlcCArICckMicpXG5cdFx0LnJlcGxhY2UoLyhbQS1aXSspKFtBLVpdW2EtelxcZF0rKS9nLCAnJDEnICsgc2VwICsgJyQyJylcblx0XHQudG9Mb3dlckNhc2UoKTtcbn07XG4iXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsInN0ciIsInNlcCIsIlR5cGVFcnJvciIsInJlcGxhY2UiLCJ0b0xvd2VyQ2FzZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/decamelize/index.js\n");

/***/ })

};
;