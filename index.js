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
  carArray = await mongoService.DecorateCarList(carArray);
  res.send(carArray);
})

//a u tebia tut nema car class da хз

// nu i poh poka sho, lets try
app.post('/filterAndSortBy', async function (req, res) {
  const mongoService = new MongoDBService();
  let carFilterArray = await mongoService.GetFilterCars(req.body);
  carFilterArray = await mongoService.DecorateCarList(carFilterArray)
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
app.get('/AddFavCar', async function (req, res) {
  const mongoService = new MongoDBService();
  let id = Number(req.query['id'])
  await mongoService.AddFavCarList(id)
  res.send(200);
})
app.get('/RemoveFavCar', async function (req, res) {
  const mongoService = new MongoDBService();
  let id = Number(req.query['id'])
  await mongoService.RemoveFavCarList(id)
  res.send(200);
})
app.get('/GetFavCarAmount', async function (req, res) {
  const mongoService = new MongoDBService();
  let amount = await mongoService.FavCarAmount()
  res.send(`${amount}`)
})
app.post('/getCarFav', async function (req, res) {
  const mongoService = new MongoDBService();
  let carListArray = await mongoService.GetFavCarList();
  carListArray = await mongoService.DecorateCarList(carListArray)
  res.send(carListArray)
})
app.get('/getManufacturerList', async function (req, res) {
  const mongoService = new MongoDBService();
  let ManufacturerList = await mongoService.GetAllManufacturer();
  res.send(ManufacturerList)
})
app.post(`/createNewCar`, async function (req, res) {
  const mongoService = new MongoDBService();
  let id = 'id' in req.query
    ? Number(req.query['id'])
    : await mongoService.maxIdCar()

  let carSetId = req.body.Car
  carSetId._id = id;
  carSetId.IsRecycle = false;
  let carSetMoreInfoId = req.body.MoreInfo
  carSetMoreInfoId.CarId = id;
  let carArray = await mongoService.createNewCar(carSetId)
  let carMoreInfo = await mongoService.createNewCarMoreInfo(carSetMoreInfoId)
  res.send({ id: id })
})
app.get('/getRecycelCarsList',async function (req, res) {
  const mongoService = new MongoDBService();
  let RecycleCarsList = await mongoService.GetRecycleCarsList()
  res.send(RecycleCarsList)
})
app.listen(3000)
