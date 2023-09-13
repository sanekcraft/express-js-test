const express = require('express')
const { getCarsFiltered, readFileAsJSON, getFavCars } = require('./services/CarSourceService');
const { MongoDBService } = require('./services/MongoDBService');
const app = express()
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
}, express.json());

app.get('/', function (req, res) {
  res.send('Hello World')
})
app.get('/getCarList', async function (req, res) {
  const mongoService = new MongoDBService();
  let carArray = await mongoService.GetAllCars();
  let ManufacturerList = await mongoService.GetAllManufacturer();
  for (let car of carArray) {
    car.Id = car._id;
    delete (car._id)
    for (let man of ManufacturerList) {
      if (car.ManufacturerId == man._id) {
        delete (car.ManufacturerId)
        car.Manufacturer = man
      }
    }
  }
  res.send(carArray);
})

//a u tebia tut nema car class da хз

// nu i poh poka sho, lets try
app.post('/filterAndSortBy', async function (req, res) {
  const mongoService = new MongoDBService();
  let carFilterArray = await mongoService.GetFilterCars(req.body);
  let ManufacturerList = await mongoService.GetAllManufacturer();
  for (let car of carFilterArray) {
    car.Id = car._id;
    delete (car._id)
    for (let man of ManufacturerList) {
      if (car.ManufacturerId == man._id) {
        delete (car.ManufacturerId)
        car.Manufacturer = man
      }
    }
  }
  res.send(carFilterArray);
})
app.get('/test', async function (req, res) {
  let manList = await getManufactureNameClass();
  res.send(manList);
})
app.get('/getMoreInfo', async function (req, res) {
  const mongoService = new MongoDBService()
  let id = Number(req.query['id']);
  
  let car = await mongoService.GetCarById(id)
  car.Id = car._id;
  delete (car._id)
  let man = await mongoService.GetManufacturerById(car.ManufacturerId);
  delete (car.ManufacturerId)
  car.Manufacturer = man
  let moreInfo = await mongoService.GetMoreInfoById(car.Id)
  car.MoreInfo = moreInfo

  res.send(car)
})
app.get('/getCar', async function (req, res) {
  const mongoService = new MongoDBService();
  let id = Number(req.query['id'])
  let car = await mongoService.GetCarById(id);
  car.Id = car._id;
  delete (car._id)
  let man = await mongoService.GetManufacturerById(car.ManufacturerId);
  delete (car.ManufacturerId)
  car.Manufacturer = man
  res.send(car)
})
app.post('/getCarFav', async function (req, res) {
  let carListArray = await readFileAsJSON('car.json')
  let FavCars = await getFavCars(carListArray, req.body)
  res.send(FavCars)
})
app.listen(3000)
