// title: String.prototype.startsWith()
// desc: This method has been added to the ECMAScript 2015 specification and may not be available in all JavaScript implementations yet.
// src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}