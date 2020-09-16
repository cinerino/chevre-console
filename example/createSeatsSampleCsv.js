const fs = require('fs');

let csv = 'branchCode';

var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
for (var i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < 100; j++) {
        csv += `\n${alphabet[i]}-${j + 1}`;
    }
};

fs.writeFileSync(`${__dirname}/seatsSample.csv`, csv);
console.log(csv);