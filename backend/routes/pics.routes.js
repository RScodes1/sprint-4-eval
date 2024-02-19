const express = require('express');
const {PicModel} = require('../model/pics.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {auth} = require('../middleware/auth.middleware');

const picRouter = express.Router();

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); 
  }
});
const upload = multer({ storage: storage });

picRouter.post('/', auth, upload.single('photo'), async(req, res) => {
  try {
    const { quote, device, commentsCount } = req.body;
    const newPost = new PicModel({
      quote,
      photo: req.file.path, 
      device,
      commentsCount,
      userID: req.user.userID 
    });
    await newPost.save();
    res.status(201).send({ msg: "New post has been uploaded" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

picRouter.get('/', auth, async (req, res) => {
  try {
    const { device, minComments, maxComments } = req.query;
    const filter = { userID: req.user.userID };

    if (device) {
      filter.device = device;
    }

    if (minComments || maxComments) {
      filter.commentsCount = {};
      if (minComments) {
        filter.commentsCount.$gte = parseInt(minComments);
      }
      if (maxComments) {
        filter.commentsCount.$lte = parseInt(maxComments);
      }
    }

    const filteredPosts = await PicModel.find(filter);
    res.send({ msg: "Filtered posts", filteredPosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

picRouter.get('/:id', auth, async(req,res)=> {

    try {
        const particularPost = await PicModel.findOne({_id: req.params.id, userID : req.body.userID});
          if(!particularPost){
            res.status(404).send({ msg: "No post found" });
        } else {
            res.send({ msg: "This is the post", particularPost });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

picRouter.patch('/:picId', auth, async(req,res)=> {
         
    const {picID} = req.params.id;

    try {
      const picToedit = await PicModel.findOne({_id: req.params.id})
          if(picToedit){
            res.status(500).send({msg: `pic with id ${picID} does not exist`});
          } 
          else if(picID.userID !== req.body.userID){
               res.status(404).send({msg: "you are not allowed to update anything"});
          } else {
            const content = await PicModel.findByIdAndUpdate({_id: picID,} ,req.body);
            res.send({msg: "pic details updated sucessfully", content});
          }
    } catch (error) {
      res.send({"error": error});
    }
})

picRouter.delete('/:picId', auth, async(req,res)=>{
    const {picID} =  req.params.id;
    try {
          const picToDelete = await PicModel.findByIdAndDelete({_id: picID});
          if(!picToDelete){
            res.status(403).send({msg: "pic not found."});
          } else {
            res.send({msg: "pic deleted successfully"});
          }
    } catch (error) {
        res.send({"error": error});
    }
})



module.exports = {
    picRouter
}