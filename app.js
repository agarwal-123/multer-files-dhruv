const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const jwt= require('jsonwebtoken')
const test=require('./models/test')



const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// Mongo URI
const mongoURI = 'mongodb+srv://imsHP:imsHP@cluster0-exoql.mongodb.net/test?retryWrites=true&w=majority';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

// Init gfs
let gfs;
var userID;

async function check(req, res, next) {
  try{
    const token = req.header('authorization').replace('Bearer ','')

    const decoded =jwt.verify(token,'aSecretKey')
    console.log(token,decoded)
    // const tup= await user.findOne({_id: decoded._id})
    // req.session.user_id=tup._id
    userID=decoded._id;
    next()
  }
    catch(e) {
      // res.send('You are not authorized to view this page');
      res.status(404).json({ message: 'You are not authorized to view this page' })
    }
}


conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        var filename = userID
        if (path.extname(file.originalname) === '.jpeg' || path.extname(file.originalname) === '.png')
          {filename = userID
          // + path.extname(file.originalname);
        }
        else{
          filename = buf.toString('hex') + path.extname(file.originalname);

          const itm=new test({userID,file:filename}) //save Name to Test database
          itm.save()
        }
 
        console.log(filename)
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route GET /
// @desc Loads form
app.get('/', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('index', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('index', { files: files });
    }
  });
});

// @route POST /upload
// @desc  Uploads file to DB
app.post('/upload', check,upload.single('file'), (req, res) => {
  // test1=mongoose.test;

  res.status(200).json({ message:"uploaded" });
  // res.redirect('/');
});



//Get all Uploads of a user
app.get('/allTests',check,async (req, res) => {
  tup = await test.find({userID: userID})
  res.status(200).json({tup})


});

// @route GET /files
// @desc  Display all files in JSON
app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
  });
});

// @route GET /image/:filename
// @desc Display Image
app.get('/image/',check, (req, res) => {
  gfs.files.findOne({ filename: userID }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/',check, (req, res) => {
  gfs.remove({ filename: userID, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }
    res.status(200).json({message:"deleted!!!"})
    // res.redirect('/');
  });
});



const port = process.env.PORT||5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
