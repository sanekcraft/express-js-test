
const { Config } = require('../environment')
const { MongoClient, Collection, Document } = require('mongodb');


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
    MongoClient;

    /**
    * @return {Promise<MongoClient>} 
    */
    async GetMongoClient() {
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
        return await collection.find({ IsRecycle: false }).toArray()
    }

    async GetCarById(id) {

        const collection = await this.getCollection(this.DbName, this.Collections.CarList)
        return (await collection.find({ _id: id }).toArray())[0];
    }
    async GetCarByIdList(idList) {
        const collection = await this.getCollection(this.DbName, this.Collections.CarList)
        return await collection.find({ _id: { $in: idList }, IsRecycle: false }).toArray();
    }

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
        return (await collection.find({ _id: id }).toArray())[0].IdList;
    }

    async GetFavCarList() {
        const favCarIdList = await this.GetFavCarsID(1);
        const carList = await this.GetCarByIdList(favCarIdList);
        return carList;
    }
    async AddFavCarList(id) {
        const collection = await this.getCollection(this.DbName, this.Collections.FavCarList)
        return await collection.updateOne({ _id: 1 }, { $push: { IdList: id } })
    }
    async RemoveFavCarList(id) {
        const collection = await this.getCollection(this.DbName, this.Collections.FavCarList)
        return await collection.updateOne({ _id: 1 }, { $pull: { IdList: id } })
    }
    async FavCarAmount() {
        const favCarCollection = await this.getCollection(this.DbName, this.Collections.FavCarList);
        const CarCollection = await this.getCollection(this.DbName, this.Collections.CarList);

        let favList = (await favCarCollection.find({ _id: 1 }).toArray())[0].IdList;

        let count = await CarCollection.countDocuments({
            $and: [
                { _id: { $in: favList } },
                { IsRecycle: false }
            ]
        })
       
        return count
    }
    async maxIdCar() {
        const collection = await this.getCollection(this.DbName, this.Collections.CarList);
        let [{ _id }] = await collection.find().sort({ "_id": -1 }).limit(1).project({ _id: 1 }).toArray();
        return _id + 1;
    }
    async createNewCar(car) {
        const collection = await this.getCollection(this.DbName, this.Collections.CarList)
        await collection.replaceOne({ _id: car._id }, car, { upsert: true })
    }
    async createNewCarMoreInfo(moreInfo) {
        const collection = await this.getCollection(this.DbName, this.Collections.CarMoreInfoList)
        await collection.replaceOne({ _id: moreInfo._id }, moreInfo, { upsert: true })
    }
    async GetRecycleCarsList() {
        const collection = await this.getCollection(this.DbName, this.Collections.CarList)
        return await collection.find({ IsRecycle: true }).toArray()
    }
    async UpdateRecycleStatus(id, Status) {
        const collection = await this.getCollection(this.DbName, this.Collections.CarList)
        await collection.updateOne({ _id: id }, { $set: { IsRecycle: Status } })
    }
    async DeletedCar(id) {
        const Car = await this.getCollection(this.DbName, this.Collections.CarList)
        await Car.deleteOne({ _id: id })
        const MoreInfo = await this.getCollection(this.DbName, this.Collections.CarMoreInfoList)
        await MoreInfo.deleteOne({ CarId: id })
        const FavList = await this.getCollection(this.DbName, this.Collections.FavCarList)
        await FavList.updateOne({ _id: 1 }, { $pull: { IdList: id } })
    }
}

module.exports = {
    MongoDBService
}
