const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
require('dotenv').config(); 

const app = express();
const PORT = 3000;

const API_URL = process.env.API_URL || 'http://localhost:5000';

app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('form');
});

app.post('/submit', async (req, res) => {
    try {
        let data = await axios.post(`${API_URL}/submit`, req.body);
        res.send('data: ' + JSON.stringify(data.data));
    } catch (err) {
        res.send("Error submitting data: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});
