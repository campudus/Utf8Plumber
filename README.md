# UTF-8 Plumber

Did you ever encounter some strange "question mark" characters in the output while streaming through some third-party module? This here may be your solution: Pipe the input file or request stream through the plumber and the following streams won't receive cut-in-half UTF-8 characters.

## The problem

When using modules like `csv`, `fast-csv` or other modules that transform streams into some other strings, most of these modules don't really handle UTF-8 inputs well.

If a stream cut happens to be between two bytes of an UTF-8 char and the module or stream you use doesn't handle it correctly (for example just appending the chars by using `chunk.toString()`), the result will be two unusable bytes in a string - that means question marks in your output.

## The solution

Just pipe the Utf8Plumber right before such a stream. It will prevent unfinished UTF-8 bytes to leak into the current chunk and provide it in the next chunk.

Here is a small example on how to use it (uppercase the first column in a CSV file):

```
var fs = require('fs');
var csv = require('csv');
var plumber = require('Utf8Plumber');

fs.createReadStream('my-file.csv')
  .pipe(plumber())
  .pipe(csv.parse())
  .pipe(csv.transform(function(record) {
    record[0] = record[0].toUpperCase();
    return record;
  })
  .pipe(csv.stringify())
  .pipe(process.stdout)
```
