

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false});


var express = require('express');
var app = express();

//exam
app.set('view engine', 'ejs');
var ExifImage = require('exif').ExifImage;
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false});
var fs = require('fs');
var formidable = require('formidable');
  http = require('http');
  url = require('url');


//upload page
app.get('/', (req, res) => {
  res.redirect('/upload');
  res.end();
  
});

app.get('/upload', (req, res) => {
  res.render('upload.ejs');
  res.end();
  
});

//change exif coordinate to google map coordinate
function ConvertCoord (degrees, minutes, seconds, direction){
  var dd = degrees + (minutes/60) + (seconds/3600);
  if (direction == "S" || direction == "W") {
    dd = dd * -1;
  }
  return dd;
}

//get result
app.post('/uploadPhoto', (req,res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
      console.log(JSON.stringify(files));

      //no file
      if (files.filetoupload.size == 0) {
        res.status(500).end('<a href="/">No file uploaded!</a>');  
      }


      let filename = files.filetoupload.path;
      if (files.filetoupload.type) {
          var mimetype = files.filetoupload.type;
          console.log(`mimetype = ${mimetype}`);
      }

      if (!mimetype.match(/^image/)) {
          res.status(500).end("Upload file not image!");
          return;
      }
    
      var title = (fields.title.length > 0) ? fields.title : "n/a";
      console.log(`title = ${title}`);

      var description = (fields.description.length > 0) ? fields.description : "n/a";
      console.log(`description = ${description}`);

    var image = "n/a";
    fs.readFile(filename, (err,data) => {
      image = new Buffer.from(data).toString('base64');
    });

    //exif
    
    var lat = 0;
    var lon = 0;
    try {
      new ExifImage({ image : filename }, function (error, exifData) {
        if (error){
            console.log('Error1: '+error.message);
            res.status(500).end('<a href="/">This type of photo is not supported</a>');  
          }
        else {
            //console.log(exifData); // Do something with your data!
          //var make = (exifData.image.Make > 0 ) ? exifData.image.Make : "n/a";
          //make = exifData.image.Make;
          var make = (exifData.image.Make.length > 0) ? exifData.image.Make : "n/a";
          var model = (exifData.image.Model.length > 0) ? exifData.image.Model : "n/a";

          var createdon = exifData.exif.CreateDate;

          console.log('Make: '+ exifData.image.Make);
            console.log('Model: '+ exifData.image.Model);
            console.log('Created on: '+ exifData.exif.CreateDate);

            lat = ConvertCoord(exifData.gps.GPSLatitude[0],exifData.gps.GPSLatitude[1],exifData.gps.GPSLatitude[2], exifData.gps.GPSLatitudeRef);
            lon = ConvertCoord(exifData.gps.GPSLongitude[0],exifData.gps.GPSLongitude[1],exifData.gps.GPSLongitude[2], exifData.gps.GPSLongitudeRef);
            res.render('result.ejs', {
                title: title,
            description: description, 
            make: make,  
            model: model,
            createdon: createdon,
            mimetype: mimetype, 
            image: image,
            lat:lat,
            lon:lon
          });   
          }

      });
    } catch (error) {
      console.log('Error: ' + error.message);
    }



  })


});

//open map
app.get('/map', (req,res) => {
  
  res.render("leaflet.ejs", {
    lat:req.query.lat, 
    lon:req.query.lon
  });
  res.end(); 
    
 
});

app.listen(process.env.PORT || 8099);
