# Reports Engine

The module can be used to group data by multiple criterias and provide the result as a table ( pivot ).

## CLI commands

```js
// build dist files
yarn dist

// run tests
yarn test
```

## How to use

There are 3 main steps:

- initialize the engine, configure data and possible dimensions
- group data by desired set of parameters
- run data calculations on grouped sets

### Initialize the engine

```js
data = new lib.Analytic({
	tables:[{
		id: "users",	// unique name for the data source
		driver: "raw",  // optional
		fields: [
			{ id: "name", type: 0 },
			{ id: "email", type: 0 },
			{ id: "birthdate", type: 3 },
		],
		data: [alex, berny, dina],
	},
	dimensions:[{
		id:"byYear",
		label:"Year",
		table:"users",
		rule:{ by:"year(birthdate)" }
		sort:"asc", // options, asc|desc|custom-function
		meta:{} // optional,  meta data
	}]
});
```

- tables - list of datasources, optional
- dimensions - list of group parameters, optional

#### Table config

- id - mandatory
- driver - defines in which way data will be stored, optional

      	- raw - store objects as is, used by default
      	- column - use data columns model, works faster for dataset with big number of fields per object

- field.type - type of data in the column. It is optional, and doesn't provide real benefits for now

      	- 0 - string
      	- 1 - number
      	- 3 - date

#### Dimension Config

- id - mandatory
- table - id of the related table, mandatory
- label - group name, optional, used for header generation
- rule - grouping rule, mandatory

      	- rule.by - grouping expression

#### Related API

Tables can be added later by using

```js
data.addTable(tableConfig);
```

Dimensions can be added later by using

```js
// add single group parameter
data.addDimension(dimensionConfig);
// or replace all used dimensions with new ones
// clears all parameter when called without new configs
data.resetDimensions([dimensionConfig1, dimensionConfig2]);
```

after adding dimension, it possible to get list of options for this dimension by using

```js
const options = data.getOptions(dimensionId);
```

**IMPORTANT** addDimension/resetDimensions will preserve old dimensions if new one has the same id. This behavior allows to cache pre-calculated data between runs. You can use the rule.by value as id, so the dimension will be cached until its grouping rule is changed.

### Group data

```js
const pivot = data.compact({
	rows: ["byYear"],
	cols: ["byAge"],
	filter: {
		region: 1,
	},
});
```

- rows - list of dimension ids, optional
- cols - list of dimension ids, optional
- filters - filter config, optional

### Export data

#### Export as a plain list

```js
const res = pivot.toArray({
	ops: ["sum(age)"],
	filters,
});
console.log(res.data);
```

- ops - array of operations, mandatory
- filters - filtering config, optional

It possible to remove duplicates from the y-scale ( first N columns of the resulting pivot ) by providing **clearRows** flag for the pivot.

```js
res.toArray({
	ops: ["COUNT(age)"],
	cleanRows: true,
});
```

#### Export as a nested tree

```js
const res = pivot.toNested({
	ops: ["sum(age)"],
	groupOps: ["sum(group)"],
	filters,
});
console.log(res.tree);
```

- groupOps - array of operations which will be used for tree branch nodes. Please beware that group operations are executed against values in child rows, not against raw data. In groupOps expression the name of fields doesn't matter, it will use data from the same columns of child rows only.

#### Calculate total

Both plain and nested exports can provide total lines, which is one more math set applied to all data ( to top elements in case of nested export )

```js
const res = pivot.toArray({
	ops: ["sum(age)"],
	total: ["sum(group)"],
}

console.log(res.total);
```

Similar to groupOps, name of field in expression doesn't matter, as math will be executed agaist aggregation results, not against the raw data.

#### Export header

```js
const header = pivot.toXHeader(res);
console.log(header.data);
```

by default header includes columns for all possible combinations of column groups, including the empty ones. If you need to exclude the empty columns you can use

```js
const header = pivot.toXHeader(res, { nonEmpty: true });
console.log(header.data);
console.log(header.nonEmpty);
```

Please beware that it will not remove empty headers from output, instead it will provider header.nonEmpty, array of indexes of non empty columns. It can be used to form correct UI later on

Also, during header generation it possible to obtain meta info for each of generated columns.

```js
const header = pivot.toXHeader(res, { meta: true });
console.log(header.data);
console.log(header.meta);
```

The resulted metainfo is taken from dimension and operation configuraitons.

## Limits

By default pivot applies next limits to the result output

- max number of columns = 5000
- max number of rows = 10000
- man number of source data row = Infinity

It possible to configure those limits during compact operation

```js
data.compact({
	limit: { rows: Infinity, columns: Infinity, raws: Infinity },
});
```

There is no need to provide all limit configs at once, not provided values will be taken from defaults.

Default values for limits can be changed in future builds. The are used as prevention for misconfiguration ( for example, providing 2 fields for columns with 65k variation each, will result in 4\*10^9 columns ). Current limits is much below the performance possibilities, still it has no sense to generate huge datasets which can't be navigated effectively by humans.

The major problem with limits is that column limit is applied before column data compression ( before removing empty columns ), it will be fixed in future build.

## Predicates

When providing filtering and grouping rules, it possible to use raw values ( default ) or process them with some predicate function

```js
// raw
{
	by: "age";
}
// with predicate
{
	by: "year(birthday)";
}
```

Default predicates:

- year
- month
- day - day of week
- hour
- minute

Custom predicates can be added

```js
data.addPredicate("odd", v => v % 2);
```

## Filtering

Filtering can be applied during `data.compact({ filters })` operation or if you need to filter already created pivot, it can be done during export with `pivot.toArray({ filters })`. It has sense to use the last one for filtering already created pivot as it will work faster ( will not redo data compact step )

filtering config is a hash of `field_name:field_value` pairs. Config can use raw values or filtering rules

```js
{
	region:2,
	age:{ gt:19, le:99 },
	"year(birthday)":{ in: [1974, 1975] }
}
```

Default filtering operators are:

- eq
- neq
- gt
- gte
- lt
- lte
- in
- hasPrefix
- contains

Custom operators can be added with

```js
data.addComparator("notIn", v => test => v.indexOf(test) === -1);
```

It is possible to use predicates in field names, like `year(birthday)`

## Expressions

Expression are used to describe math processing during data grouping
It can be as simple as single math call

```js
{ ops:[
	"sum(age)"
	"wavg(const, rating)"
]}
```

or any combination of math calls

```js
{ ops:[
	"sum(salesA) + sum(salesB)"
	"round(avg(rating))"
]}
```

please beware that field names in expression is actually an arrays of data, so something like `sum(salesA+salesB)` will not work

it possible to define label and meta data for the result column

```js
ops: ["sum(age)", { math: "COUNT(age)", label: "COUNT", meta: {} }];
```

Default operations:

- round
- sum
- min
- max
- avg
- wavg - weighted average
- count
- any - returns any value from the group

Custom operations can be added with

```js
data.addMath("floor", v => Math.floor(v));
data.addMath("mult", v => v.reduce((acc, v) => acc * v, 1));
```

## Performance cost of different steps

- adding tables - 0%
- adding dimensions - 0%
- compact - 40%
- filter - 10%
- export - 35%
- compression - 10%
- creating header - 5%

## Whats next

Next is not implemented, but can be added in a future:

- the engine has possibility to calculate and export data by chunks on demand ( instead of exporting all data at once ) which allows to work with really huge result tables which normally can't fit because of memory limits.

- there is a way to decrease cost of grouping by more aggressive data caching during dimension creation. Preliminary results shows about 20% - 500% performance boost based on data configuration and usage scenario. Further investigating is necessary.
