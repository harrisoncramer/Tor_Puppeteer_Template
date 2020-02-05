module.exports = {
    asyncForEach: async(array, callback) => {
        let results = [];
        for (let index = 0; index < array.length; index++) {
            let result = await callback(array[index]);
            results.push(result);
        }
        return results;
    },
    getRandom: (bottom, top) => {
        return function() {
            return Math.floor( Math.random() * ( 1 + top - bottom ) ) + bottom;
        }
    }
};