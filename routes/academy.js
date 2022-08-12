var express = require("express");
var router = express.Router();
var Academy = require("../models/academy");
const middleware = require("../middleware/index");

router.get("/academy", (req, res, next) => {
  res.status(200).json("Academy route working successfully");
});

router.post("/academy/post", middleware.isAdmin, async (req, res, next) => {
  const title = req.body.title;
  const moduleNo = req.body.module;
  const content = req.body.content;
  const plan = req.body.plan;

  const post = new Academy({
    title: title,
    module: moduleNo,
    content: content,
    plan: plan,
  });

  try {
    const postSave = await post.save();
    res.status(201).json("Post saved successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.get("/academy/post", middleware.isLoggedIn, async (req, res, next) => {
  let posts = await Academy.find();
  res.status(200).json(posts);
});

module.exports = router;
