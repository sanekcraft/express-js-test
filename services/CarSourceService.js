
const fs = require('node:fs/promises');

//тут мы из файлика достаем жсон и в нем масив машин, теперя будет это заменять на монгу, и данные из нее
// новый файлик делаем, в нем будет "общение"  с монгой
async function readFileAsJSON(filePath) {
    let file = await fs.readFile(`./data/${filePath}`);
    let carArray = JSON.parse(file.toString());
    return carArray;
}
async function getManufacturerList() {
    let manufacturerList = await readFileAsJSON('manufacturer.json')
    return manufacturerList;
}
async function getFavCars(cars, id) { 
    return cars.filter(x=>id.includes(x.Id))
}

function isMatchFilter(ManufacturerNameElement, element, filterObj) {
    let isNameMatch = ManufacturerNameElement.toLowerCase().startsWith(filterObj.searchString);
    let isModelMatch = element.Model.toLowerCase().startsWith(filterObj.searchString);
    let isTopSpeedMatch = element.TopSpeed >= filterObj.searchSpeed;
    let isTransmissionMatch = element.TransmissionType.some(transmissionId => filterObj.searchTransmission.includes(transmissionId))
    let isFuelTankSize = element.FuelTankSize >= filterObj.searchFuelTank
    let isAceletation = element.ZeroTo100Time >= filterObj.searchAcceleration
    return ((isModelMatch || isNameMatch) && isTopSpeedMatch && isTransmissionMatch && isFuelTankSize && isAceletation)
}

async function getCarsFiltered(carListArray, filterObj) {

    let manufacturerList = await getManufacturerList();

    const findManufacturerName = (manId) => manufacturerList.find(x => x.id == manId).name;
    switch (filterObj.sortOrder) {
        case 'name-asc':
            carListArray.sort((a, b) => {
                if (findManufacturerName(a.manufacturerID) > findManufacturerName(b.manufacturerID)) {
                    return 1;
                }
                if (findManufacturerName(a.manufacturerID) < findManufacturerName(b.manufacturerID)) {
                    return -1;
                } else {
                    return 0;
                }
            });
            break;
        case 'name-desc':
            carListArray.sort((a, b) => {
                if (findManufacturerName(a.manufacturerID) > findManufacturerName(b.manufacturerID)) {
                    return -1;
                }
                if (findManufacturerName(a.manufacturerID) < findManufacturerName(b.manufacturerID)) {
                    return 1;
                } else {
                    return 0;
                }
            });
            break;
        case 'years-asc':
            carListArray.sort((a, b) => a.YearOfManufacture - b.YearOfManufacture);
            break;
        case 'years-desc':
            carListArray.sort((a, b) => b.YearOfManufacture - a.YearOfManufacture);
            break;
        case 'engine-power-asc':
            carListArray.sort((a, b) => a.EngineCapacity - b.EngineCapacity);
            break;
        case 'engine-power-desc':
            carListArray.sort((a, b) => b.EngineCapacity - a.EngineCapacity);
            break;
    }

    let filterCars = [];
    for (let element of carListArray) {
        if (isMatchFilter(findManufacturerName(element.manufacturerID), element, filterObj)) {
            filterCars.push(element)
        }
    }

    return filterCars
}


module.exports = {
    readFileAsJSON, getManufacturerList, getCarsFiltered, getFavCars
}