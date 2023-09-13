
const { Config } = require('../environment')
const { MongoClient, Collection, Document } = require('mongodb');


//єто будет класс, то есть для каждого "подключения" мы будем создавать новый екземпляр класса монгоДБСервис, андесентд? Yes

class MongoDBService {

    DbName = "CarShop";
    Collections = {
        CarList: "CarList",
        ManufacturerList: "ManufacturerList",
        CarMoreInfoList: "CarMoreInfoList",
        FavCarList: "FavCarList"
    }

    constructor() {

    }

    // mi nikogda ne budem use this var potomusha ono u nas budet tolko dla togo
    //shob odin raz sdelat client, mi potom budem vsegda usat function shob get client
    // andested?Yes
    MongoClient;

    /**
    * @return {Promise<MongoClient>} 
    */
    async GetMongoClient() {

        //a shas budet magic of 3 tochka, look
        // nema 3 tochka as you can see but its same thing vnutri, kak 3 tochka delaet to tut eta zhe ficha
        // andestend?? Poka ne osobo
        //a shas no tam config do Host bulo
        // vse ravno ne aneds ponel vse)

        if (this.MongoClient == null) {

            const { Host, Port } = Config.MongoDB;
            let client = new MongoClient(`mongodb://${Host}:${Port}`);
            await client.connect();
            this.MongoClient = client;
            client.db()
        }
        return this.MongoClient;
    }

    /**
    * @return {Promise<Collection<Document>>}
    */
    async getCollection(dbName, collectionName) {
        const client = await this.GetMongoClient();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        return collection;
    }
    async GetAllCars() {

        const collection = await this.getCollection(this.DbName, this.Collections.CarList)
        return await collection.find().toArray()
    }

    async GetCarById(id) {

        const collection = await this.getCollection(this.DbName, this.Collections.CarList)
        return (await collection.find({ _id: id }).toArray())[0];
    }
    async GetCarByIdList(idList) {

        const collection = await this.getCollection(this.DbName, this.Collections.CarList)
        return await collection.find({ _id: { $in: idList } }).toArray();
    }
    // mnoga povtoriaetsa odno i tozhe, ne horosho, nada shob mense bilo povtorenia, andestend Yes toka sho tyt sdelat to
    // new function
    async GetAllManufacturer() {
        const collection = await this.getCollection(this.DbName, this.Collections.ManufacturerList)
        return await collection.find().toArray()
    }

    async GetManufacturerById(id) {
        const collection = await this.getCollection(this.DbName, this.Collections.ManufacturerList)
        return (await collection.find({ _id: id }).toArray())[0]
    }

    async GetMoreInfoById(id) {
        const collection = await this.getCollection(this.DbName, this.Collections.CarMoreInfoList)
        return (await collection.find({ CarId: id }).toArray())[0]
    }

    async GetManufacturerListByNameFilter(searchString) {
        const collection = await this.getCollection(this.DbName, this.Collections.ManufacturerList)
        let manList = await collection.find({
            Name: { $regex: `^${searchString}.*`, $options: "i" }
        }).toArray();
        return manList.map(x => x._id);
    }

    getSortOrderObject(sortOrder) {
        switch (sortOrder) {
            case 'name-asc': return { Model: 1 }
            case 'name-desc': return { Model: -1 }

            case 'years-asc': return { YearOfManufacture: 1 }
            case 'years-desc': return { YearOfManufacture: -1 }

            case 'engine-power-asc': return { EngineCapacity: 1 }

            case 'engine-power-desc': return { EngineCapacity: -1 }

        }
    }
    async GetFilterCars(FilterInfo) {
        const collection = await this.getCollection(this.DbName, this.Collections.CarList);
        let manIdList = await this.GetManufacturerListByNameFilter(FilterInfo.searchString);
        const mongoFilterObject = {
            $and: [
                {
                    $or: [
                        { Model: { $regex: `^${FilterInfo.searchString}.*`, $options: "i" } },
                        { ManufacturerId: { $in: manIdList } }
                    ]
                },
                { TopSpeed: { $gte: FilterInfo.searchSpeed } },
                { FuelTankSize: { $gte: FilterInfo.searchFuelTank } },
                { ZeroTo100Time: { $gte: FilterInfo.searchAcceleration } },
                { TransmissionType: { $in: FilterInfo.searchTransmission } },
            ]
        };
        let sortObject = this.getSortOrderObject(FilterInfo.sortOrder);
        return await collection.find(mongoFilterObject).sort(sortObject).toArray()
    }
    async DecorateCarList(carList) {
        let ManufacturerList = await this.GetAllManufacturer();
        let FavCarList = await this.GetFavCarsID(1)//  tut masiv
        for (let car of carList) {
            car.Id = car._id;
            delete (car._id)

            car.IsFaved = FavCarList.includes(car.Id);//true\false;

            car.Manufacturer = ManufacturerList.find(x => x._id == car.ManufacturerId);
            delete (car.ManufacturerId)
        }
        return carList
    }
    async GetFavCarsID(id) {
        const collection = await this.getCollection(this.DbName, this.Collections.FavCarList)
        return (await collection.find({ _id: id }).toArray())[0].IdList; // {_id:1, IdList:[...]}
    }

    async GetFavCarList() {
        const favCarIdList = await this.GetFavCarsID(1);
        const carList = await this.GetCarByIdList(favCarIdList);
        return carList;
    }
    async AddFavCarList(id) {
        const collection = await this.getCollection(this.DbName, this.Collections.FavCarList)
        return await collection.updateOne({ _id: 1 },{ $push: { IdList: id } })
    }
    async RemoveFavCarList(id) {
        const collection = await this.getCollection(this.DbName, this.Collections.FavCarList)
        return await collection.updateOne({ _id: 1 },{ $pull: { IdList: id } })
    }
}

module.exports = {
    MongoDBService
}
