const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 3000;

const app = express();

app.listen(port, console.log(`server started on port: ${port}`));

app.use(express.static(path.join(__dirname, 'public')))
