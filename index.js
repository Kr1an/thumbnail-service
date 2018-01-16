require('./models');
const
  express    = require('express'),
  mongoose   = require('mongoose'),
  bodyParser = require('body-parser'),
  fileUpload = require('express-fileupload'),
  cors       = require('cors'),
  path       = require('path'),
  app        = express();
  // logger     = require('express-logger');

mongoose.connect(`mongodb://mongodb/jobhub`);

app
  .use(express.static(path.join(__dirname, 'public')))
  // .use(logger())
  .use(cors())
  .use(fileUpload())
  .use(bodyParser.json())
  .use('/jobrequests', require('./router'))
  .listen(3000);
