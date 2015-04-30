var imgs = fs.readdirSync('./public/img/poll/outlets/200');

var outlets = imgs.filter(function(img) {return path.extname(img) == '.jpg';}).map(function(img) {var arr = path.basename(img, '.jpg').split(/\s+/);return {code: arr[0],name: arr[1]};});

var Vote = require('./models/vote');

var votes;
Vote.aggregate().match({category: 'outlets'}).group({_id: '$code',count: {$sum: 1}}).exec(function (err, docs) {votes = docs});

votes.forEach(function(vote) {outlets.find(function(option) {return option.code == vote._id;}).vote = vote.count;});

var result = outlets.sort(function(a, b) {return (b.vote || 0) - (a.vote || 0);}).slice(0, 50);

result.forEach(function (o) {console.log([o.name, o.code, o.vote].join(','));});
