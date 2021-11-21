//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-varun:12345@cluster0.u4vnu.mongodb.net/listDB");

const itemsSchema = ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDoList!"
});

const item2 = new Item({
  name: "Hit + to add a new item."
});

const item3 = new Item({
  name: "<<< Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if(foundItems.length === 0){

      Item.insertMany(defaultItems, function(err){
        if(!err){
          console.log("default items inserted.");
        }
      });
      res.redirect("/");
    } else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });

});

app.get("/:customListName", function(req, res){

  const customListName = _.capitalize(req.params.customListName);

  const list = new List({
    name: customListName,
    items: defaultItems
  });

  List.findOne({name: customListName}, function(err, foundList){

    if(!err){

      if(!foundList){
        // create a new list
        list.save();
        res.redirect("/" +customListName);
      } else{
        // render the list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }

    }

  });

});

app.post("/", function(req, res){

  const newItem = req.body.newItem;
  const listName = req.body.listName;

  const item = new Item({
    name: newItem
  });

  if(listName === "Today"){

    item.save();
    res.redirect("/");

  } else{

    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" +listName);
    });

  }
  
});

app.post("/delete", function(req, res){

  const checkboxID = req.body.checkboxID;
  const listTitle = req.body.listTitle;

  if(listTitle === "Today"){

    Item.findByIdAndRemove(checkboxID, function(err){
      if(!err){
        console.log("Checked item deleted successfully!");
      }
    });
  
    res.redirect("/");

  } else{

    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkboxID}}}, function(err, foundList){
      if(!err){
        res.redirect("/" +listTitle);
      }
    });

  }

});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully!");
});
