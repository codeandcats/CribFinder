# CribFinder
#### A site for helping you find the perfect home

![](/public/images/cf-logo-bw.jpg)

![This project is a work in progress](http://s12.postimg.org/h1mxvvul9/work_in_progress.jpg)

## Build Instructions
1. Install [Python 2.x](https://www.python.org/downloads/)

2. Install [MongoDB](https://www.mongodb.org/downloads)

3. Set up your database directory
	```
	cd c:
	mkdir data
	mkdir data/db
	```

4. Install [Node.js](https://nodejs.org/en/)

5. Install Packages:
	```
	npm install
	```

6. Install global packages
	```
	npm install tsd gulp -g
	```

7. Install TypeScript Definitions:
	```
	tsd install
	```

8. Run gulp to build the project
	```
	gulp
	```

## Running Site
1. Run:
	```
	node bin/www
	```

2. Browse:

	[http://localhost:3000](http://localhost:3000)
