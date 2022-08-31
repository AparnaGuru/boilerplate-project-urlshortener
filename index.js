require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
    extended: false
}));

const port = process.env.PORT || 3000;
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});
// Your first API endpoint
app.get("/api/hello", function(req, res) {
    res.json({
        greeting: 'hello API'
    });
});




mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const schema = mongoose.Schema;
const urlSchema = new schema({
    original: {
        type: String,
        required: true
    },
    short: Number
});
const urlModel = mongoose.model("urlModel", urlSchema);


// Basic Configuration
var respObjs = {}
app.post("/api/shorturl", (req, res) => {
            var inputShort = 1

            //var sampRegex = new RegExp("/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-      9()@:%_\+.~#?&//=]*)?/gi");
            //if (!req.body["url"].match(sampRegex)) {
            //  res.json({error: "invalid URL"})
            //  return
            //}
            const dns = require('dns');
            const URL = require('url').URL;
            const urlObject = new URL(req.body["url"]);
            dns.lookup(urlObject.hostname, (err, address, family) => {
                if (err) {
                    res.json({
                        error: "invalid URL"
                    })
                } else {


                    console.log(req.body["url"])
                    respObjs["original_url"] = req.body["url"];


                    urlModel.findOne({}) //pick the first row after sorting
                        .sort({
                            short: 'desc'
                        })
                        .exec((err, result) => {
                            if (!err && result != undefined) { //when there are entries, to calc the short val
                                inputShort = result.short + 1
                            }
                            if (!err) { //update DB
                                urlModel.findOneAndUpdate({
                                        original: req.body["url"]
                                    }, //find the record if any
                                    {
                                        original: req.body["url"],
                                        short: inputShort
                                    }, {
                                        new: true,
                                        upsert: true
                                    }, //new will return the updated doc, upsert will insert if val not found
                                    (err, savedurl) => {
                                        if (!err) {
                                            respObjs['short_url'] = savedurl.short
                                            res.json(respObjs);
                                        }
                                    })
                            }
                        })
                }
            });
});

app.get("/api/shorturl/:input", (req,res)=>{
  var input = req.params.input;
  urlModel.findOne({short:input}, (err, result) =>{
    if(!err && result != undefined){
      res.redirect(result.original)
    }
    else{
      res.json("URL not found")
    }
    
  })
});

            app.listen(port, function() {
                console.log(`Listening on port ${port}`);
            });
