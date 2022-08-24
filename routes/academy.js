var express = require("express");
var router = express.Router();
var Academy = require("../models/academy");
const middleware = require("../middleware/index");

router.get("/academy", (req, res, next) => {
  res.status(200).json("Academy route working successfully");
});

router.post("/academy/post", async (req, res, next) => {
  const title = req.body.title;
  const subtopic = req.body.subtopic;
  const content = req.body.content;
  const plans = req.body.plan;
  const tutor = req.body.tutor;
  const topic = req.body.topic;
  let plan;

  if (plans.toLowerCase() === "starter") plan = ["Starter"];
  if (plans.toLowerCase() === "silver") plan = ["Starter", "Silver"];
  if (plans.toLowerCase() === "diamond")
    plan = ["Starter", "Silver", "Diamond"];

  const post = new Academy({
    title: title,
    topic: topic,
    subtopic: subtopic,
    content: content,
    plan: plan,
    tutor: tutor,
  });

  try {
    const postSave = await post.save();
    res.status(201).json("Post saved successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.get("/academy/post", async (req, res, next) => {
  let posts = await Academy.find();
  res.status(200).json(posts);
});

module.exports = router;
