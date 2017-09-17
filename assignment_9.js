var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({
    defaultLayout: 'main'
});

var session = require('express-session');
var bodyParser = require('body-parser'); 
app.use(bodyParser.urlencoded({
    extended: false
}));  
app.use(bodyParser.json());

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', 3872);

app.use(session({
    secret: 'Password'
}));

var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'mysql.eecs.oregonstate.edu',
    user: 'cs290_cisnerog',
    password: 'xxxxxx',
    database: 'cs290_cisnerog'
});

app.get('/', function (req, res, next) {
    var context = {};
    if (!session.workouts) {
        pool.query("DROP TABLE IF EXISTS workouts", function (err) {
            var createString = "CREATE TABLE workouts(" +
                "id INT PRIMARY KEY AUTO_INCREMENT," +
                "name VARCHAR(255) NOT NULL," +
                "reps INT," +
                "weight INT," +
                "unit BOOLEAN," +
                "date DATE)";

            pool.query(createString, function (err) {
                res.render('workouts', context);
            })
        });
    } //end of if
});

app.post('/', function (req, res, next) {
    var context = {};
	if(req.body['add workout'] && req.body.name==''){console.log('add a name')};
    if (req.body['add workout'] && req.body.name!=''){

        pool.query('INSERT INTO workouts (name, reps, weight, unit, date) VALUES (?,?,?,?,?)', [req.body.name, req.body.reps, req.body.weight, req.body.unit, req.body.date], function (results) {

            pool.query('SELECT * FROM workouts', function (err, rows, fields) {
                 if(err){
                	next(err);
                	return;
                } 
                //context.results = JSON.parse(JSON.stringify(rows));
                context.results = rows;
		res.render('workouts', context);

            });
        });
    }

    /*
    if(!req.session.workouts){ //no workouts
    	res.render('reset_workouts', context);
    	return;
    }
	*/	
	
    if(req.body['edit']){
	pool.query('SELECT * FROM workouts WHERE id=?', [req.body.id], function(err, result){
		if(err){
			next(err);a
			return;
		}

		if(result.length == 1){
			context.cur = result[0];	
			res.render('edit', context.cur);
		}
	
	});
    }
	if(req.body['update'] && req.body.name!=''){
		pool.query('UPDATE workouts SET name=?, reps=?, weight=?, unit=?, date=?', [req.body.name, req.body.reps, req.body.weight, req.body.unit, req.body.date], function(err, result){
			if(err){
				next(err);
				return;
			}	
			
			pool.query('SELECT * FROM workouts', function(err, rows, fields){
				if(err){
					next(err);
					return;
				}
				
				context.results = rows;
				res.render('workouts', context)
			});
		});

	}

    if(req.body['delete']){
	pool.query('DELETE FROM workouts WHERE id=?', [req.body.id], function(err, result){
		if(err){
			next(err);
			return;
		}
		pool.query('SELECT * FROM workouts', function(err, rows, fields){
			//context.results = JSON.parse(JSON.stringify(rows));
                	context.results = rows;
			res.render('workouts', context);
		});
		
	});
    } 
	

});

app.use(function (req, res) { //page not found
    res.status(404);
    res.render('404');
});

app.use(function (err, req, res, next) { //error
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
