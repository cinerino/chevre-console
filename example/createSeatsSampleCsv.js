const fs = require('fs');

let csv = 'branchCode';

for (let i = 0; i < 1000; i++) {
    csv += `\n${`000${i}`.slice(-4)}`;
}

fs.writeFileSync(`${__dirname}/seatsSample.csv`, csv);
console.log(csv);