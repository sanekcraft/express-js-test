 
const { Config } = require('../environment')
const { MongoClient } = require('mongodb');


//єто будет класс, то есть для каждого "подключения" мы будем создавать новый екземпляр класса монгоДБСервис, андесентд? Yes

class MongoDBService {

    DbName = "CarShop";
    Collections = {
        CarList: "CarList",
        ManufacturerList: "ManufacturerList",
        CarMoreInfoList: "CarMoreInfoList"
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
    * @return {Promise<Car[]>}
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

    async GetMoreInfoById(id){
        const collection = await this.getCollection(this.DbName, this.Collections.CarMoreInfoList)
        return (await collection.find({ CarId: id }).toArray())[0]
    }


    //ok, poka sho mi niche eshe ne dostali, prosto poluchili DB and collection, teper from collection we can get data, lets see how    

    // teper mi mozhem poprobovat is it workeng vobshe, nuzhno zamenit ispolzovanie json, tam gde endpoit kotorii delaet getAll cars, change it please
}

module.exports = {
    MongoDBService
}