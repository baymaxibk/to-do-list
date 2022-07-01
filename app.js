import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import { mongoose } from 'mongoose'
import lodash from 'lodash'
const {capitalize} = lodash
const app = express()


app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

mongoose.connect(process.env.MONGODB_URL)
const itemsSchema = new mongoose.Schema({
  name: String,
})
const Item = mongoose.model('Item', itemsSchema)

const defaultItems = [
  { name: 'Buy Food' },
  { name: 'Make Food' },
  { name: 'Eat Food' },
]
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
})

const List = mongoose.model('List', listSchema)

app.get('/', function (req, res) {
  Item.find({}, (err, items) => {
    if (err) {
      console.log(err)
    } else if (items.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Items added successfully')
        }
        res.redirect('/')
      })
    } else {
      res.render('list', { listTitle: 'Today', newListItems: items })
    }
  })
})

app.get('/about', function (req, res) {
  res.render('about')
})

app.get('/:listName', (req, res) => {
  const listName = capitalize(req.params.listName)
  List.findOne({ name: listName }, async (err, result) => {
    if (err) {
      console.log(err)
    } else if (!result) {
      const list = new List({
        name: listName,
        items: defaultItems,
      })
      await list.save()
      res.redirect(`/${listName}`)
    } else {
      res.render('list', {
        listTitle: result.name + ' List',
        newListItems: result.items,
      })
    }
  })
})

app.post('/', function (req, res) {
  const item = req.body.newItem
  const listName = req.body.list

  const userItem = Item({
    name: item,
  })

  if (listName === 'Today') {
    userItem.save()
    res.redirect('/')
  } else {
    List.findOne({ name: listName }, (err, result) => {
      if (err) {
        console.log(err)
      } else {
        result.items.push(userItem)
        result.save()
        res.redirect(`/${listName}`)
      }
    })
  }
})

app.post('/delete', (req, res) => {
  const itemId = req.body.checkbox
  const listName = req.body.list
  if (listName === 'Today') {
    Item.findByIdAndRemove(itemId, (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log('Deleted Successfully')
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: itemId } } },
      (err, result) => {
        if (err) {
          console.log(err)
        } else {
          console.log("Successfully Deleted Item")
          res.redirect(`/${listName}`)
        }
      }
    )
    
  }
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Server started on port 3000')
})

