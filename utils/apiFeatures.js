// move all the controller functions into a class and then move that class into
// a separate module
class APIFeatures {
    // query = mongodb obj that we are manipulating
    // queryString = everything after the ? on the URL request
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    // create one method for each functionallity

    filter() {
        //BUILD QUERY  
        // 1A) basic Filtering
        // need an actual copy of the req object, not just a reference to it.
        // {...req.query} the ... destructures the obj and the {} restructure it as a new obj
        // in this way we create a new copy. kind of a trick. 
        const queryObj = {...this.queryString};
        // now exclude any fields that we don't want to use for db filter
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // 1B) Advanced Filtering. need to convert gte to $gte
        // use regex to convert gt, gte, lt, lte
        // convert obj to string, do a replace
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, match => `$${match}`)

        // mongoose way
        //const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');

        // this only works if only query params are sent via URL
        // const tours = await Tour.find(req.query);
        // const tours = await Tour.find(queryObj);

        // Tour.find() returns a query. If we want to do other things, we need to get that obj, perform
        // sort and what not and then await the result... as follows
        // to sort by price, ascending: &sort=price  descending: &sort=-price
        // let tourQuery = Tour.find(JSON.parse(queryStr));
        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    // sort returned data based on whatever
    sort() {
        // expecting a comma separated string: ?sort=duration,price
        // if client sends ?sort=duration&sort=price   we get an array. hpp middleware fixes so we don't get
        // an error, but will only sort on the last item
        if(this.queryString.sort) {
            // how to sort on more than one field: .sort('price ratingsAverage')
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            // default sort if none is specified
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    // limit the fields return to the caller based on what they ask for
    limitFields() {
        // localhost:3000/api/v1/tours?fields=name,duration,difficulty,price
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            // default: exclude the _v: field
            this.query = this.query.select('-__v'); // use minus to exclude a field
        }
        return this;
    }

    // Lots of returned data? how about some pagination?
    paginate() {
        const page = this.queryString.page * 1 || 1;  // convert string to int and set default of 1. **Tricky AF
        const limit = this.queryString.limit * 1 || 100;   // default 100
        const skip = (page - 1) * limit;

        // tourQuery = tourQuery.skip(20).limit(10)
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;
