const express = require('express');
const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello Worlds!')
})

app.get('/ping', (req, res) => {
  res.send('Pong!')
})

app.get('/api', (req, res) => {
  res.json({ "users": ["userOne","userTwo","userThree"] })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
